import db from "./firebase.js";
import { nanoid } from "nanoid";
import axios from "axios";

/* ============================== 1) CONFIG ============================== */

const config = {
  lootlabsApiKey: process.env.LOOTLABS_API_KEY || "d2cc58f8084e256f9a15e41ab3971855c0289ed29a00dbf681e31b8b237ace81",
  linkvertiseUserId: process.env.LINKVERTISE_USER_ID || "1322389",
  nitroLinkApiKey: process.env.NITRO_LINK_API_KEY || "21a96ba57ee7a54bbbfbb7f0b180901f8f8a3ec9",
  linkJustApiToken: process.env.LINKJUST_API_TOKEN || "944c5ea148b949eb99be07963d8615e6904f460b",
  adminKey: process.env.ADMIN_SECRET_KEY || "Hema123i#",
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
  rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 5),
  taskDurationSeconds: 7, 
  minStaySeconds: 5,     
  vpnCheckEnabled: (process.env.VPN_CHECK_ENABLED ?? "true") === "true",
};

const spamCache = new Map();

/* ========================== 2) AD NETWORK HANDLERS ========================== */

async function resolveUnlockUrl(network, id, req) {
  const host = req.headers.host || "www.subx.click";
  const protocol = req.headers["x-forwarded-proto"] || (host.includes("localhost") ? "http" : "https");
  
  const completionUrl = `${protocol}://${host}/api/complete?id=${id}&network=${network}`;

  try {
    if (network === "just") {
      const apiUrl = `https://linkjust.com/api?api=${config.linkJustApiToken}&url=${completionUrl}&alias=${id}`;
      try {
        const res = await axios.get(apiUrl, { 
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
          },
          timeout: 5000 
        });
        
        if (res.data?.status === "success" && res.data.shortenedUrl) {
          return res.data.shortenedUrl.replace(/\\\//g, "/");
        }
      } catch (err) {
        console.warn("LinkJust direct API failed, using fallback");
      }
      
      return `https://linkjust.com/st?api=${config.linkJustApiToken}&url=${completionUrl}`;
    }

    if (network === "nitrolink") {
      const reqUrl = `https://nitro-link.com/api?api=${config.nitroLinkApiKey}&url=${encodeURIComponent(completionUrl)}`;
      const res = await axios.get(reqUrl, { timeout: 5000 });
      if (res.data?.status === "success" && res.data.shortenedUrl) {
        return res.data.shortenedUrl.replace(/\\\//g, "/");
      }
    }

    if (network === "lootlabs") {
      const res = await axios.post(
        "https://creators.lootlabs.gg/api/public/content_locker",
        { title: id, url: completionUrl, tier_id: 1, number_of_tasks: 3, theme: 1 },
        { headers: { Authorization: `Bearer ${config.lootlabsApiKey}`, "Content-Type": "application/json" }, timeout: 5000 }
      );
      const messageData = Array.isArray(res.data?.message) ? res.data.message[0] : res.data?.message;
      const rawUrl = messageData?.loot_url || res.data?.loot_url || completionUrl;
      return rawUrl.replace(/\\\//g, "/");
    } 
    
    if (network === "linkvertise") {
      const base64Url = Buffer.from(completionUrl).toString("base64");
      const rnd = Math.random().toString(36).slice(2, 9);
      return `https://link-to.net/${config.linkvertiseUserId}/${rnd}/dynamic?r=${base64Url}`;
    }
  } catch (e) {
    console.error(`Ad Network (${network}) Error:`, e.message);
  }
  
  return completionUrl;
}

/* ============================== 3) TEMPLATES ============================== */

const vpnBlockUI = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VPN Detected 🛡️</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --bg-dark: #0a0d14; --text-main: #ffffff; --theme-blue: #0087FC; }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
        body { 
          background-color: var(--bg-dark); 
          background-image: radial-gradient(rgba(0, 135, 252, 0.12) 1px, transparent 1px);
          background-size: 24px 24px;
          display: flex; justify-content: center; align-items: center; min-height: 100vh; color: var(--text-main); padding: 20px; 
        }
        .main-card {
          width: 440px; max-width: 100%; padding: 40px 30px; border-radius: 28px;
          background: #12161f; border: 1px solid rgba(255, 255, 255, 0.05); text-align: center;
          box-shadow: 0 20px 50px rgba(0,0,0,0.6);
        }
        h1 { color: var(--theme-blue); margin-bottom: 12px; font-size: 1.7rem; font-weight: 800; }
        p { color: #8a94a6; font-size: 1rem; margin-bottom: 20px; line-height: 1.5; }
        .error-icon { font-size: 60px; color: var(--theme-blue); margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="main-card">
        <div class="error-icon"><i class="fa-solid fa-shield-halved"></i></div>
        <h1>VPN Detected!</h1>
        <p>We detected that you are using a VPN or Proxy connection.</p>
        <p style="color:#fff; font-weight:bold;">Please turn off your VPN and refresh the page to continue.</p>
    </div>
</body>
</html>`;

const notFoundPage = () => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Not Found 404</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box;font-family:'Plus Jakarta Sans',sans-serif}
  body{background:#0a0d14;display:flex;justify-content:center;align-items:center;min-height:100vh;color:#fff}
  .box{text-align:center}
  h1{font-size:4rem;color:#0087FC}
  p{color:#64748b;margin-top:8px}
</style>
</head>
<body><div class="box"><h1>404</h1><p>This content does not exist or has been removed.</p></div></body>
</html>`;

const generatePageHtml = (linkData, unlockUrl, taskDurationSeconds, minStaySeconds) => {
  const { title, description, image, tasks = [] } = linkData;
  const totalTasks = tasks.length;

  const tasksHtml = totalTasks
    ? `
    <div class="step-indicator">
      <span class="step-text">Step 1 of 1</span>
      <div class="step-bar"></div>
    </div>
    
    <div class="tasks-container">
      ${tasks
        .map(
          (task, idx) => `
        <div class="task-card" id="task-card-${idx}">
          <a href="${task.link}" target="_blank" rel="noopener" class="task-btn" id="task-btn-${idx}" onclick="startTaskTracker(${idx})">
            <div class="task-info">
              <div class="icon-box">
                <i class="fa-brands fa-${task.platform || "youtube"}"></i>
              </div>
              <div class="task-text-wrap">
                <span class="task-title">${task.action}</span>
                <span class="task-sub" id="sub-text-${idx}">Click to complete step</span>
              </div>
            </div>
            
            <div class="task-action-side">
              <span class="timer-badge" id="timer-badge-${idx}" style="display:none;">
                <i class="fa-solid fa-spinner fa-spin"></i> <span id="timer-num-${idx}">${taskDurationSeconds}</span>s
              </span>
              <div class="action-circle arrow" id="link-${idx}">
                <i class="fa-solid fa-chevron-right"></i>
              </div>
              <div class="action-circle check" id="check-${idx}" style="display:none;">
                <i class="fa-solid fa-check"></i>
              </div>
            </div>
          </a>
          <div class="task-alert-box" id="alert-${idx}"></div>
        </div>`
        )
        .join("")}
    </div>`
    : "";

  return `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title || "Content Locked"}</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>
  :root {
    --bg-dark: #0a0e14;
    --card-bg: #141820;
    --task-bg: #1a1f2c;
    --theme-blue: #0087FC;
    --theme-blue-hover: #0076e0;
    --text-main: #ffffff;
    --text-sub: #8a94a6;
    --success: #10b981;
    --danger: #ef4444;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }

  body {
    background-color: var(--bg-dark);
    /* Grid background pattern identical to screenshot */
    background-image: radial-gradient(rgba(0, 135, 252, 0.12) 1.2px, transparent 1.2px);
    background-size: 24px 24px;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    color: var(--text-main);
  }

  .main-card {
    width: 440px;
    max-width: 100%;
    padding: 36px 28px;
    border-radius: 28px;
    background: var(--card-bg);
    border: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7);
    text-align: center;
  }

  .avatar-wrap {
    width: 80px;
    height: 80px;
    margin: 0 auto 18px auto;
    border-radius: 50%;
    border: 2px solid var(--theme-blue);
    padding: 3px;
    box-shadow: 0 0 18px rgba(0, 135, 252, 0.25);
  }
  .avatar-wrap img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  h1 {
    font-size: 1.85rem;
    font-weight: 800;
    color: #ffffff;
    margin-bottom: 6px;
    letter-spacing: -0.5px;
  }

  .desc {
    color: var(--text-sub);
    font-size: 0.95rem;
    margin-bottom: 22px;
    font-weight: 500;
  }

  /* Step Indicator */
  .step-indicator {
    margin-bottom: 22px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .step-text {
    font-size: 13px;
    color: var(--text-sub);
    font-weight: 700;
  }
  .step-bar {
    width: 32px;
    height: 6px;
    background: var(--theme-blue);
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0, 135, 252, 0.6);
  }

  /* Tasks Container */
  .tasks-container {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin-bottom: 26px;
  }

  .task-card {
    background: var(--task-bg);
    border: 1px solid rgba(255, 255, 255, 0.04);
    border-radius: 18px;
    overflow: hidden;
    transition: all 0.25s ease;
  }
  .task-card:hover {
    border-color: rgba(0, 135, 252, 0.3);
    transform: translateY(-2px);
  }

  .task-btn {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 18px;
    text-decoration: none;
    color: #fff;
  }

  .task-info {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .icon-box {
    font-size: 22px;
    color: #ff0000; /* YouTube Icon default color */
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .task-text-wrap {
    text-align: left;
    display: flex;
    flex-direction: column;
  }
  .task-title {
    font-weight: 700;
    font-size: 15px;
    color: #fff;
  }
  .task-sub {
    font-size: 12px;
    color: var(--text-sub);
    margin-top: 2px;
  }

  .task-action-side {
    display: flex;
    align-items: center;
  }

  .action-circle {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    transition: 0.2s ease;
  }
  .action-circle.arrow {
    background: var(--theme-blue);
    color: #ffffff;
    box-shadow: 0 0 12px rgba(0, 135, 252, 0.4);
  }
  .action-circle.check {
    background: rgba(16, 185, 129, 0.15);
    color: var(--success);
    border: 1px solid var(--success);
  }

  .timer-badge {
    background: rgba(0, 135, 252, 0.12);
    border: 1px solid var(--theme-blue);
    color: var(--theme-blue);
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
  }

  .task-alert-box {
    font-size: 12px;
    font-weight: 700;
    padding: 0 18px 12px 18px;
    text-align: left;
    display: none;
  }
  .task-alert-box.error { color: var(--danger); display: block; }
  .task-alert-box.success { color: var(--success); display: block; }

  /* Toast Notification */
  .toast-container {
    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
    z-index: 9999; display: flex; flex-direction: column; gap: 10px; pointer-events: none;
  }
  .toast {
    background: #141820; border: 1px solid var(--danger); color: #fff;
    padding: 14px 22px; border-radius: 14px; font-size: 13.5px; font-weight: 700;
    display: flex; align-items: center; gap: 10px; box-shadow: 0 15px 35px rgba(0,0,0,0.5);
    animation: toastIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
  }
  @keyframes toastIn { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } }

  /* Main Button Style matching 0087FC Theme */
  .btn {
    width: 100%; padding: 16px; border-radius: 16px; font-size: 16px; font-weight: 800;
    text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 10px;
    border: none; cursor: pointer; transition: all 0.25s ease;
  }
  .default-btn {
    color: #ffffff;
    background: var(--theme-blue);
    box-shadow: 0 8px 25px rgba(0, 135, 252, 0.35);
  }
  .default-btn:hover:not(.disabled) {
    background: var(--theme-blue-hover);
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(0, 135, 252, 0.5);
  }
  .default-btn.disabled {
    background: #1a1f2c; color: #4a5568; border: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: none; pointer-events: none;
  }

  .footer-brand {
    margin-top: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: var(--text-sub);
    font-weight: 600;
  }
  .brand-highlight {
    color: var(--theme-blue);
    font-weight: 800;
  }
</style>
</head>
<body>
  <div class="toast-container" id="toastBox"></div>

  <div class="main-card">
    <div class="avatar-wrap">
      <img src="${image || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}" alt="Avatar">
    </div>
    
    <h1>${title || "Content Locked"}</h1>
    <p class="desc">${description || "Follow the social steps below to unlock"}</p>
    
    ${tasksHtml}

    <a id="unlockBtn" href="${unlockUrl}" class="btn default-btn ${totalTasks > 0 ? "disabled" : ""}" onclick="handleUnlockClick(event)">
      <i class="fa-solid fa-lock" id="unlockIcon"></i> <span id="unlockText">Unlock Content</span>
    </a>

    <div class="footer-brand">
      <span>Powered by</span>
      <span class="brand-highlight">SubX</span>
    </div>
  </div>

<script>
(function(){
  const totalTasks = ${totalTasks};
  const taskDuration = ${taskDurationSeconds};
  const minStay = ${minStaySeconds};

  let completedTasksCount = 0;
  const taskData = {};

  function showToast(message) {
    const toastBox = document.getElementById('toastBox');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = '<i class="fa-solid fa-circle-xmark" style="color:#ef4444; font-size:16px;"></i> ' + message;
    toastBox.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  window.startTaskTracker = function(index) {
    if (taskData[index] && taskData[index].completed) return;

    const badge = document.getElementById('timer-badge-' + index);
    const alertBox = document.getElementById('alert-' + index);
    const timerNum = document.getElementById('timer-num-' + index);
    const linkOrb = document.getElementById('link-' + index);
    const subText = document.getElementById('sub-text-' + index);
    
    alertBox.style.display = 'none';

    if (!taskData[index]) {
      taskData[index] = { completed: false, blurTime: 0, focusTime: 0, timer: null, remaining: taskDuration };
    }
    
    const current = taskData[index];
    current.blurTime = 0;
    current.focusTime = 0;
    current.remaining = taskDuration;

    badge.style.display = 'inline-block';
    linkOrb.style.display = 'none';
    subText.innerText = 'Waiting for completion...';
    timerNum.innerText = current.remaining;

    const onBlur = () => {
      current.blurTime = performance.now();
    };

    const onFocus = () => {
      current.focusTime = performance.now();
    };

    window.addEventListener('blur', onBlur, { once: true });
    window.addEventListener('focus', onFocus, { once: true });

    if (current.timer) clearInterval(current.timer);

    current.timer = setInterval(() => {
      current.remaining--;
      timerNum.innerText = current.remaining;

      if (current.remaining <= 0) {
        clearInterval(current.timer);
        
        let awaySeconds = 0;
        if (current.blurTime > 0 && current.focusTime > 0) {
          awaySeconds = (current.focusTime - current.blurTime) / 1000;
        } else if (current.blurTime > 0) {
          awaySeconds = (performance.now() - current.blurTime) / 1000;
        } else {
          awaySeconds = taskDuration; 
        }

        if (awaySeconds >= minStay) {
          completeTask(index);
        } else {
          badge.style.display = 'none';
          linkOrb.style.display = 'flex';
          subText.innerText = 'Click to try again';
          
          const textMsg = 'لف و ارجع اعمل المهمه 👀';
          alertBox.className = 'task-alert-box error';
          alertBox.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> ' + textMsg;
          
          showToast(textMsg);
        }
      }
    }, 1000);
  };

  function completeTask(index) {
    const badge = document.getElementById('timer-badge-' + index);
    const alertBox = document.getElementById('alert-' + index);
    const checkOrb = document.getElementById('check-' + index);
    const subText = document.getElementById('sub-text-' + index);

    taskData[index].completed = true;
    completedTasksCount++;

    badge.style.display = 'none';
    checkOrb.style.display = 'flex';
    subText.innerText = 'Step Completed!';
    subText.style.color = '#10b981';

    alertBox.className = 'task-alert-box success';
    alertBox.innerHTML = '<i class="fa-solid fa-circle-check"></i> Completed!';

    updateProgress();
  }

  function updateProgress() {
    if (completedTasksCount >= totalTasks) {
      const btn = document.getElementById('unlockBtn');
      if (btn) {
        btn.classList.remove('disabled');
        document.getElementById('unlockIcon').className = 'fa-solid fa-lock-open';
      }
    }
  }

  window.handleUnlockClick = function(event) {
    const btn = document.getElementById('unlockBtn');
    if (btn.classList.contains('disabled')) {
      event.preventDefault();
      showToast('Please complete the steps first!');
    }
  };

  if (totalTasks === 0) updateProgress();
})();
</script>
</body>
</html>`;
};

/* ============================== 4) HELPERS ============================== */

function getClientIp(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
}

async function checkIsVpn(ip) {
  if (!config.vpnCheckEnabled || !ip || ip === "::1" || ip === "127.0.0.1") return false;
  try {
    const response = await axios.get(`https://blackbox.ipinfo.app/lookup/${ip}`, { timeout: 4000 });
    return typeof response.data === "string" && response.data.trim() === "Y";
  } catch {
    return false;
  }
}

/* ============================== 5) API HANDLER ============================== */

export default async function handler(req, res) {
  try {
    if (req.method === "PATCH") {
      const { lootlabsEnabled, linkvertiseEnabled, nitrolinkEnabled, adminKey } = req.body || {};
      if (!config.adminKey || adminKey !== config.adminKey) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const settings = {
        lootlabs: Boolean(lootlabsEnabled),
        linkvertise: Boolean(linkvertiseEnabled),
        nitrolink: Boolean(nitrolinkEnabled),
      };

      await db.collection("settings").doc("adNetworks").set(settings);
      return res.status(200).json({ success: true, message: "Settings updated successfully", settings });
    }

    if (req.method === "POST") {
      const { title, description, image, targetUrl, monetization, tasks, slug } = req.body || {};
      if (!targetUrl || !title) return res.status(400).json({ success: false, message: "Title and targetUrl required" });

      const id = slug?.trim() ? slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "") : nanoid(6);
      const trimmedUrl = targetUrl.trim();

      await db.collection("links").doc(id).set({
        title,
        description: description || "",
        image: image || "",
        targetUrl: trimmedUrl,
        monetization: monetization || "just",
        tasks: Array.isArray(tasks) ? tasks : [],
        createdAt: Date.now(),
        clicks: 0,
      });

      return res.status(200).json({ success: true, short: `${req.headers.origin}/${id}` });
    }

    if (req.method === "GET") {
      const ip = getClientIp(req);

      if (await checkIsVpn(ip)) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.status(403).send(vpnBlockUI);
      }

      const id = req.query.id;
      if (!id) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.status(404).send(notFoundPage());
      }

      const doc = await db.collection("links").doc(id).get();
      if (!doc.exists) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.status(404).send(notFoundPage());
      }

      const data = doc.data();
      const network = data.monetization || "just";
      
      const unlockUrl = await resolveUnlockUrl(network, id, req);

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(generatePageHtml(
        data, 
        unlockUrl, 
        config.taskDurationSeconds,
        config.minStaySeconds
      ));
    }

    return res.status(405).send("Method Not Allowed");
  } catch (err) {
    console.error("Critical Handler Error:", err.message);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(500).send(notFoundPage());
  }
}
