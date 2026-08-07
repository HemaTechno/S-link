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

/* ========================== 2) AD NETWORK HANDLERS ========================== */

async function resolveUnlockUrl(network, id, req) {
  const host = req.headers.host || "www.subx.click";
  const protocol = req.headers["x-forwarded-proto"] || (host.includes("localhost") ? "http" : "https");
  
  const completionUrl = `${protocol}://${host}/api/complete?id=${id}&network=${network}`;

  try {
    if (network === "just") {
      const apiUrl = `https://linkjust.com/api?api=${config.linkJustApiToken}&url=${encodeURIComponent(completionUrl)}&alias=${id}`;
      try {
        const res = await axios.get(apiUrl, { timeout: 4000 });
        if (res.data?.status === "success" && res.data.shortenedUrl) {
          return res.data.shortenedUrl;
        }
      } catch (err) {
        console.warn("LinkJust API fallback to QuickLink mode");
      }
      return `https://linkjust.com/st?api=${config.linkJustApiToken}&url=${encodeURIComponent(completionUrl)}`;
    }

    if (network === "nitrolink") {
      const reqUrl = `https://nitro-link.com/api?api=${config.nitroLinkApiKey}&url=${encodeURIComponent(completionUrl)}`;
      const res = await axios.get(reqUrl, { timeout: 5000 });
      if (res.data?.status === "success" && res.data.shortenedUrl) {
        return res.data.shortenedUrl;
      }
    }

    if (network === "lootlabs") {
      const res = await axios.post(
        "https://creators.lootlabs.gg/api/public/content_locker",
        { title: id, url: completionUrl, tier_id: 1, number_of_tasks: 3, theme: 1 },
        { headers: { Authorization: `Bearer ${config.lootlabsApiKey}`, "Content-Type": "application/json" }, timeout: 5000 }
      );
      const messageData = Array.isArray(res.data?.message) ? res.data.message[0] : res.data?.message;
      return messageData?.loot_url || res.data?.loot_url || completionUrl;
    } 
    
    if (network === "linkvertise") {
      const base64Url = Buffer.from(completionUrl).toString("base64");
      const rnd = Math.random().toString(36).slice(2, 9);
      return `https://link-to.net/${config.linkvertiseUserId}/${rnd}/dynamic?r=${base64Url}`;
    }
  } catch (e) {
    console.error(`Ad Network (${network}) Exception Suppressed:`, e.message);
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
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --bg-dark: #0c0d10; --glass-bg: rgba(20, 21, 25, 0.6); --text-main: #ffffff; }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
        body { background-color: var(--bg-dark); display: flex; justify-content: center; align-items: center; min-height: 100vh; color: var(--text-main); padding: 20px; }
        .container { width: 480px; max-width: 100%; padding: 40px 35px; border-radius: 28px; background: var(--glass-bg); backdrop-filter: blur(20px); border: 1px solid rgba(255, 165, 0, 0.4); text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.7); }
        h1 { color: #ffa500; margin-bottom: 15px; font-size: 1.8rem; font-weight: 800; }
        p { color: #aaa; font-size: 1.1rem; margin-bottom: 20px; line-height: 1.6; }
        .error-icon { font-size: 70px; color: #ffa500; margin-bottom: 25px; text-shadow: 0 0 20px rgba(255, 165, 0, 0.4); }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon"><i class="fa-solid fa-shield-halved"></i></div>
        <h1>VPN / Proxy Detected!</h1>
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
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@700;800&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box;font-family:'Tajawal',sans-serif}
  body{background:#050811;display:flex;justify-content:center;align-items:center;min-height:100vh;color:#fff}
  .box{text-align:center}
  h1{font-size:4rem;background:linear-gradient(135deg,#00f0ff,#0077ff);-webkit-background-clip:text;background-clip:text;color:transparent}
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
    <div class="progress-wrap">
      <div class="progress-label"><span id="progressText">0 / ${totalTasks} Completed</span></div>
      <div class="progress-track"><div class="progress-fill" id="progressFill"></div></div>
    </div>
    <div class="tasks-container">
      ${tasks
        .map(
          (task, idx) => `
        <div class="task-wrapper">
          <a href="${task.link}" target="_blank" rel="noopener" class="task-btn" id="task-btn-${idx}" onclick="startTaskTracker(${idx})">
            <span class="task-info"><i class="fa-brands fa-${task.platform || "link"}"></i> ${task.action}</span>
            <span class="task-timer-badge" id="timer-badge-${idx}" style="display:none;"><i class="fa-solid fa-spinner fa-spin"></i> جاري التحقق... <span id="timer-num-${idx}">${taskDurationSeconds}</span>s</span>
            <i class="fa-solid fa-circle-check check-icon" id="check-${idx}" style="display:none;"></i>
            <i class="fa-solid fa-arrow-up-right-from-square link-icon" id="link-${idx}"></i>
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
<title>${title || "Unlock Content"}</title>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>
  :root{
    --primary-blue:#0088ff; --accent-cyan:#00f0ff; --bg-dark:#050811;
    --glass-bg:rgba(10,18,32,.75); --text-main:#fff; --success:#00ff88; --warn:#ffaa00; --danger:#ff5c5c;
  }
  *{margin:0;padding:0;box-sizing:border-box;font-family:'Tajawal',sans-serif}
  body{
    background:var(--bg-dark);
    background-image:radial-gradient(at 15% 15%,rgba(0,136,255,.18) 0,transparent 55%),
                     radial-gradient(at 85% 85%,rgba(0,240,255,.12) 0,transparent 55%);
    display:flex;justify-content:center;align-items:center;min-height:100vh;color:var(--text-main);padding:20px;
  }
  .container{
    width:480px;max-width:100%;padding:36px 26px;border-radius:28px;
    background:var(--glass-bg);backdrop-filter:blur(25px);-webkit-backdrop-filter:blur(25px);
    border:1px solid rgba(0,240,255,.15);text-align:center;
    box-shadow:0 25px 55px rgba(0,0,0,.6),inset 0 1px 1px rgba(255,255,255,.08);
  }
  .media-img{width:100%;max-height:200px;object-fit:cover;border-radius:18px;margin-bottom:20px;border:1px solid rgba(0,240,255,.2)}
  h1{color:var(--accent-cyan);margin-bottom:8px;font-size:1.55rem;font-weight:800;text-shadow:0 0 15px rgba(0,240,255,.3)}
  .desc{color:#94a3b8;margin-bottom:22px;font-size:.94rem;line-height:1.5}

  .progress-wrap{margin-bottom:18px;text-align:left}
  .progress-label{font-size:12px;color:#94a3b8;margin-bottom:6px;font-weight:700}
  .progress-track{height:8px;border-radius:8px;background:rgba(255,255,255,.08);overflow:hidden}
  .progress-fill{height:100%;width:0%;background:linear-gradient(90deg,var(--primary-blue),var(--accent-cyan));transition:width .4s ease;border-radius:8px}

  .tasks-container{margin-bottom:22px;text-align:left}
  .task-wrapper{margin-bottom:12px}
  .task-btn{
    display:flex;justify-content:space-between;align-items:center;gap:10px;
    background:rgba(15,28,48,.6);border:1px solid rgba(0,240,255,.15);
    padding:14px 16px;border-radius:14px;color:#fff;text-decoration:none;
    font-weight:700;font-size:13.5px;transition:all .25s ease;
  }
  .task-btn:hover{background:rgba(0,136,255,.2);border-color:var(--accent-cyan)}
  .task-btn.completed{border-color:var(--success);background:rgba(0,255,136,.08);color:var(--success);pointer-events:none}
  .task-btn.active-timer{border-color:var(--warn);background:rgba(255,170,0,.08);color:var(--warn)}
  .task-info{display:flex;align-items:center;gap:8px}
  .task-timer-badge{background:var(--warn);color:#000;font-size:11px;font-weight:800;padding:2px 8px;border-radius:8px;flex-shrink:0}
  .check-icon{color:var(--success)}

  .task-alert-box{font-size:12px;font-weight:700;margin-top:6px;padding:8px 12px;border-radius:10px;display:none}
  .task-alert-box.error{background:rgba(255,92,92,.12);border:1px solid rgba(255,92,92,.3);color:var(--danger);display:block}
  .task-alert-box.success{background:rgba(0,255,136,.12);border:1px solid rgba(0,255,136,.3);color:var(--success);display:block}

  /* Toast Notification */
  .toast-container {
    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
    z-index: 9999; display: flex; flex-direction: column; gap: 10px; pointer-events: none;
  }
  .toast {
    background: rgba(20, 25, 40, 0.95); border: 1px solid var(--danger); color: #fff;
    padding: 14px 22px; border-radius: 14px; font-size: 14px; font-weight: bold;
    display: flex; align-items: center; gap: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    backdrop-filter: blur(10px); animation: toastIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
  }
  @keyframes toastIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }

  .btn{width:100%;padding:17px;border-radius:16px;font-size:15.5px;font-weight:800;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:10px;border:none;cursor:pointer;transition:all .25s}
  .default-btn{color:#050811;background:linear-gradient(135deg,#00f0ff 0%,#0077ff 100%);box-shadow:0 6px 20px rgba(0,136,255,.3)}
  .default-btn.disabled{background:rgba(255,255,255,.08);color:#475569;cursor:not-allowed;box-shadow:none}
</style>
</head>
<body>
  <div class="toast-container" id="toastBox"></div>

  <div class="container">
    ${image ? `<img src="${image}" class="media-img" alt="Thumbnail" loading="lazy">` : ""}
    <h1>${title || "Locked Content"}</h1>
    ${description ? `<p class="desc">${description}</p>` : ""}
    
    ${tasksHtml}

    <button id="unlockBtn" class="btn default-btn ${totalTasks > 0 ? "disabled" : ""}" onclick="handleUnlockClick()">
      <i class="fa-solid fa-lock" id="unlockIcon"></i> <span id="unlockText">Unlock Content</span>
    </button>
  </div>

<script>
(function(){
  const totalTasks = ${totalTasks};
  const targetRedirectUrl = ${JSON.stringify(unlockUrl)};
  const taskDuration = ${taskDurationSeconds};
  const minStay = ${minStaySeconds};

  let completedTasksCount = 0;
  const taskData = {};

  function showToast(message) {
    const toastBox = document.getElementById('toastBox');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = '<i class="fa-solid fa-circle-xmark" style="color:#ff5c5c; font-size:16px;"></i> ' + message;
    toastBox.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  window.startTaskTracker = function(index) {
    if (taskData[index] && taskData[index].completed) return;

    const taskBtn = document.getElementById('task-btn-' + index);
    const badge = document.getElementById('timer-badge-' + index);
    const alertBox = document.getElementById('alert-' + index);
    const timerNum = document.getElementById('timer-num-' + index);
    
    alertBox.style.display = 'none';

    if (!taskData[index]) {
      taskData[index] = { completed: false, blurTime: 0, focusTime: 0, timer: null, remaining: taskDuration };
    }
    
    const current = taskData[index];
    current.blurTime = 0;
    current.focusTime = 0;
    current.remaining = taskDuration;

    taskBtn.className = 'task-btn active-timer';
    badge.style.display = 'inline-block';
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
          taskBtn.className = 'task-btn';
          badge.style.display = 'none';
          
          const textMsg = 'لف و ارجع اعمل المهمه 👀';
          alertBox.className = 'task-alert-box error';
          alertBox.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> ' + textMsg;
          
          showToast(textMsg);
        }
      }
    }, 1000);
  };

  function completeTask(index) {
    const taskBtn = document.getElementById('task-btn-' + index);
    const badge = document.getElementById('timer-badge-' + index);
    const alertBox = document.getElementById('alert-' + index);

    taskData[index].completed = true;
    completedTasksCount++;

    taskBtn.className = 'task-btn completed';
    badge.style.display = 'none';
    document.getElementById('check-' + index).style.display = 'inline-block';
    document.getElementById('link-' + index).style.display = 'none';

    alertBox.className = 'task-alert-box success';
    alertBox.innerHTML = '<i class="fa-solid fa-circle-check"></i> تم إتمام المهمة بنجاح!';

    updateProgress();
  }

  function updateProgress() {
    const fill = document.getElementById('progressFill');
    const text = document.getElementById('progressText');
    if (fill) fill.style.width = (totalTasks ? (completedTasksCount / totalTasks) * 100 : 100) + '%';
    if (text) text.innerText = completedTasksCount + ' / ' + totalTasks + ' Completed';

    if (completedTasksCount >= totalTasks) {
      const btn = document.getElementById('unlockBtn');
      if (btn) {
        btn.classList.remove('disabled');
        document.getElementById('unlockIcon').className = 'fa-solid fa-lock-open';
      }
    }
  }

  // استخدام window.location.href للتحويل الصريح وتجنب حظر الشاشة البيضاء about:blank#blocked
  window.handleUnlockClick = function() {
    const btn = document.getElementById('unlockBtn');
    if (btn.classList.contains('disabled')) {
      showToast('من فضلك أكمل كافة المهام المطلوبة أولاً لفتح الرابط!');
      return;
    }
    
    window.location.href = targetRedirectUrl;
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
