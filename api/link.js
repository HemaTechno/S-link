
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
  minStaySeconds: 4,     
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
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --bg-dark: #070913; --text-main: #ffffff; }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
        body { background-color: var(--bg-dark); display: flex; justify-content: center; align-items: center; min-height: 100vh; color: var(--text-main); padding: 20px; }
        .glass-card {
          width: 480px; max-width: 100%; padding: 40px 35px; border-radius: 32px;
          background: rgba(255, 165, 0, 0.03); backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 165, 0, 0.25); text-align: center;
          box-shadow: 0 30px 60px rgba(0,0,0,0.8), inset 0 1px 2px rgba(255, 165, 0, 0.3);
        }
        h1 { color: #ffa500; margin-bottom: 15px; font-size: 1.8rem; font-weight: 800; }
        p { color: #94a3b8; font-size: 1.1rem; margin-bottom: 20px; line-height: 1.6; }
        .error-icon { font-size: 70px; color: #ffa500; margin-bottom: 25px; text-shadow: 0 0 30px rgba(255, 165, 0, 0.5); }
    </style>
</head>
<body>
    <div class="glass-card">
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
  body{background:#070913;display:flex;justify-content:center;align-items:center;min-height:100vh;color:#fff}
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
      <div class="progress-label">
        <span><i class="fa-solid fa-list-check"></i> قائمة المهام</span>
        <span id="progressText" class="progress-counter">0 / ${totalTasks} مكتملة</span>
      </div>
      <div class="progress-track"><div class="progress-fill" id="progressFill"></div></div>
    </div>
    <div class="tasks-container">
      ${tasks
        .map(
          (task, idx) => `
        <div class="task-card" id="task-card-${idx}">
          <a href="${task.link}" target="_blank" rel="noopener" class="task-btn" id="task-btn-${idx}" onclick="startTaskTracker(${idx})">
            <div class="task-left">
              <div class="icon-orb"><i class="fa-brands fa-${task.platform || "link"}"></i></div>
              <span class="task-title">${task.action}</span>
            </div>
            
            <div class="task-status">
              <span class="pulse-badge" id="timer-badge-${idx}" style="display:none;">
                <span class="spinner"></span> 
                <span id="timer-num-${idx}">${taskDurationSeconds}</span>s
              </span>
              <div class="check-orb" id="check-${idx}" style="display:none;">
                <i class="fa-solid fa-check"></i>
              </div>
              <div class="arrow-orb" id="link-${idx}">
                <i class="fa-solid fa-chevron-right"></i>
              </div>
            </div>
          </a>
          <div class="task-scan-line" id="scan-${idx}"></div>
          <div class="task-alert-box" id="alert-${idx}"></div>
        </div>`
        )
        .join("")}
    </div>`
    : "";

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title || "Unlock Content"}</title>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>
  :root {
    --primary-cyan: #00f0ff;
    --primary-blue: #7000ff;
    --accent-pink: #ff007f;
    --bg-dark: #050711;
    --liquid-glass: rgba(255, 255, 255, 0.03);
    --glass-border: rgba(255, 255, 255, 0.12);
    --text-main: #ffffff;
    --success: #00ffa3;
    --warn: #ffb700;
    --danger: #ff4757;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Tajawal', sans-serif; }

  body {
    background-color: var(--bg-dark);
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    color: var(--text-main);
    overflow-x: hidden;
    position: relative;
  }

  /* Liquid Blobs Ambient Ambient Effect */
  .liquid-blob {
    position: absolute;
    filter: blur(80px);
    border-radius: 50%;
    z-index: 0;
    animation: floatBlob 10s infinite alternate ease-in-out;
  }
  .blob-1 { width: 320px; height: 320px; background: rgba(0, 240, 255, 0.25); top: 10%; left: 15%; }
  .blob-2 { width: 380px; height: 380px; background: rgba(112, 0, 255, 0.3); bottom: 10%; right: 15%; animation-delay: -5s; }

  @keyframes floatBlob {
    0% { transform: translate(0, 0) scale(1); }
    100% { transform: translate(40px, 50px) scale(1.15); }
  }

  /* Liquid Glass Main Container */
  .glass-card {
    position: relative;
    z-index: 10;
    width: 460px;
    max-width: 100%;
    padding: 38px 28px;
    border-radius: 32px;
    background: var(--liquid-glass);
    backdrop-filter: blur(35px) saturate(180%);
    -webkit-backdrop-filter: blur(35px) saturate(180%);
    border: 1px solid var(--glass-border);
    box-shadow: 
      0 30px 60px rgba(0, 0, 0, 0.7),
      inset 0 1px 0 rgba(255, 255, 255, 0.25),
      inset 0 -1px 0 rgba(0, 0, 0, 0.5);
    text-align: center;
    overflow: hidden;
  }

  .media-img {
    width: 100%;
    max-height: 190px;
    object-fit: cover;
    border-radius: 20px;
    margin-bottom: 20px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  }

  h1 {
    font-size: 1.65rem;
    font-weight: 900;
    background: linear-gradient(135deg, #fff 30%, var(--primary-cyan) 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    margin-bottom: 8px;
  }

  .desc {
    color: #94a3b8;
    font-size: 0.95rem;
    line-height: 1.5;
    margin-bottom: 24px;
    font-weight: 500;
  }

  /* Progress Bar */
  .progress-wrap { margin-bottom: 20px; text-align: right; }
  .progress-label {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 12.5px; color: #cbd5e1; font-weight: 700; margin-bottom: 8px;
  }
  .progress-counter { color: var(--primary-cyan); font-family: monospace; font-size: 13px; }
  .progress-track {
    height: 8px; border-radius: 10px; background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.08); overflow: hidden;
  }
  .progress-fill {
    height: 100%; width: 0%;
    background: linear-gradient(90deg, var(--primary-blue), var(--primary-cyan));
    box-shadow: 0 0 12px var(--primary-cyan);
    transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 10px;
  }

  /* Tasks Liquid Container */
  .tasks-container { margin-bottom: 24px; display: flex; flex-direction: column; gap: 12px; }
  .task-card {
    position: relative; border-radius: 20px; overflow: hidden;
    background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .task-card:hover {
    border-color: rgba(0, 240, 255, 0.3);
    background: rgba(255, 255, 255, 0.04);
    transform: translateY(-2px);
  }

  .task-btn {
    display: flex; justify-content: space-between; align-items: center;
    padding: 16px 18px; color: #fff; text-decoration: none; font-weight: 700; font-size: 14px;
  }

  .task-left { display: flex; align-items: center; gap: 12px; }
  .icon-orb {
    width: 38px; height: 38px; border-radius: 12px;
    background: rgba(0, 240, 255, 0.1); border: 1px solid rgba(0, 240, 255, 0.2);
    color: var(--primary-cyan); display: flex; justify-content: center; align-items: center; font-size: 16px;
  }

  .task-status { display: flex; align-items: center; gap: 8px; }
  .arrow-orb, .check-orb {
    width: 32px; height: 38px; display: flex; align-items: center; justify-content: center;
    color: #64748b; font-size: 13px; transition: 0.3s;
  }
  .check-orb { color: var(--success); font-size: 16px; }

  /* Hologram Scan Animation on Active Timer */
  .task-scan-line {
    position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 183, 0, 0.15), transparent);
    pointer-events: none; display: none;
  }
  .task-card.active .task-scan-line {
    display: block; animation: scanAnim 1.8s infinite linear;
  }
  @keyframes scanAnim { 0% { left: -100%; } 100% { left: 100%; } }

  .task-card.active { border-color: var(--warn); background: rgba(255, 183, 0, 0.05); }
  .task-card.completed { border-color: rgba(0, 255, 163, 0.3); background: rgba(0, 255, 163, 0.04); pointer-events: none; }

  .pulse-badge {
    background: rgba(255, 183, 0, 0.15); border: 1px solid var(--warn); color: var(--warn);
    padding: 4px 10px; border-radius: 20px; font-size: 11.5px; font-weight: 800; display: flex; align-items: center; gap: 6px;
  }
  .spinner {
    width: 8px; height: 8px; border-radius: 50%; background: var(--warn);
    animation: pulseGlow 1s infinite alternate;
  }
  @keyframes pulseGlow { from { opacity: 0.3; transform: scale(0.8); } to { opacity: 1; transform: scale(1.2); } }

  .task-alert-box {
    font-size: 12px; font-weight: 700; padding: 0 18px 12px 18px; text-align: right; display: none;
  }
  .task-alert-box.error { color: var(--danger); display: block; }
  .task-alert-box.success { color: var(--success); display: block; }

  /* Toast Notification Popup */
  .toast-container {
    position: fixed; top: 25px; left: 50%; transform: translateX(-50%);
    z-index: 9999; display: flex; flex-direction: column; gap: 10px; pointer-events: none;
  }
  .toast {
    background: rgba(10, 14, 26, 0.92); border: 1px solid rgba(255, 71, 87, 0.4); color: #fff;
    padding: 14px 24px; border-radius: 16px; font-size: 13.5px; font-weight: 800;
    display: flex; align-items: center; gap: 10px; box-shadow: 0 15px 35px rgba(0,0,0,0.6);
    backdrop-filter: blur(15px); animation: toastIn 0.35s cubic-bezier(0.18, 0.89, 0.32, 1.28);
  }
  @keyframes toastIn { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } }

  /* Liquid Unlock Button */
  .btn {
    width: 100%; padding: 18px; border-radius: 20px; font-size: 16px; font-weight: 900;
    text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 10px;
    border: none; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .default-btn {
    color: #050711;
    background: linear-gradient(135deg, var(--primary-cyan) 0%, #0088ff 100%);
    box-shadow: 0 10px 30px rgba(0, 240, 255, 0.35);
  }
  .default-btn:hover:not(.disabled) {
    transform: translateY(-2px);
    box-shadow: 0 15px 40px rgba(0, 240, 255, 0.5);
  }
  .default-btn.disabled {
    background: rgba(255, 255, 255, 0.05); color: #475569;
    border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: none; pointer-events: none;
  }
</style>
</head>
<body>
  <div class="liquid-blob blob-1"></div>
  <div class="liquid-blob blob-2"></div>

  <div class="toast-container" id="toastBox"></div>

  <div class="glass-card">
    ${image ? `<img src="${image}" class="media-img" alt="Thumbnail" loading="lazy">` : ""}
    <h1>${title || "فتح المحتوى المقفول"}</h1>
    ${description ? `<p class="desc">${description}</p>` : ""}
    
    ${tasksHtml}

    <a id="unlockBtn" href="${unlockUrl}" class="btn default-btn ${totalTasks > 0 ? "disabled" : ""}" onclick="handleUnlockClick(event)">
      <i class="fa-solid fa-lock" id="unlockIcon"></i> <span id="unlockText">فتح المحتوى المباشر</span>
    </a>
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
    toast.innerHTML = '<i class="fa-solid fa-circle-xmark" style="color:#ff4757; font-size:16px;"></i> ' + message;
    toastBox.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  window.startTaskTracker = function(index) {
    if (taskData[index] && taskData[index].completed) return;

    const card = document.getElementById('task-card-' + index);
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

    card.className = 'task-card active';
    badge.style.display = 'flex';
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
          card.className = 'task-card';
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
    const card = document.getElementById('task-card-' + index);
    const badge = document.getElementById('timer-badge-' + index);
    const alertBox = document.getElementById('alert-' + index);

    taskData[index].completed = true;
    completedTasksCount++;

    card.className = 'task-card completed';
    badge.style.display = 'none';
    document.getElementById('check-' + index).style.display = 'flex';
    document.getElementById('link-' + index).style.display = 'none';

    alertBox.className = 'task-alert-box success';
    alertBox.innerHTML = '<i class="fa-solid fa-circle-check"></i> تم إتمام المهمة بنجاح!';

    updateProgress();
  }

  function updateProgress() {
    const fill = document.getElementById('progressFill');
    const text = document.getElementById('progressText');
    if (fill) fill.style.width = (totalTasks ? (completedTasksCount / totalTasks) * 100 : 100) + '%';
    if (text) text.innerText = completedTasksCount + ' / ' + totalTasks + ' مكتملة';

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
      showToast('من فضلك أكمل كافة المهام المطلوبة أولاً لفتح الرابط!');
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
