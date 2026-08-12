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

/* ========================== 2) DYNAMIC AD NETWORK RESOLVER ========================== */

async function resolveUnlockUrl(requestedNetwork, id, req) {
  const host = req.headers.host || "www.subx.click";
  const protocol = req.headers["x-forwarded-proto"] || (host.includes("localhost") ? "http" : "https");
  
  const cookieHeader = req.headers.cookie || '';
  const hasNitroDone = cookieHeader.includes('nitro_24h_cooldown=1');
  const hasJustDone = cookieHeader.includes('linkjust_24h_cooldown=1');
  const hasLootDone = cookieHeader.includes('lootlabs_24h_cooldown=1');

  let activeNetwork = requestedNetwork;

  if (requestedNetwork === "just" || requestedNetwork === "nitrolink" || requestedNetwork === "lootlabs") {
    if (requestedNetwork === "just" && hasJustDone) {
      activeNetwork = "nitrolink";
      if (hasNitroDone) {
        activeNetwork = "lootlabs";
      }
    } else if (requestedNetwork === "nitrolink" && hasNitroDone) {
      activeNetwork = "just";
      if (hasJustDone) {
        activeNetwork = "lootlabs";
      }
    }

    if (hasJustDone && hasNitroDone && !hasLootDone) {
      activeNetwork = "lootlabs";
    } else if (hasJustDone && hasNitroDone && hasLootDone) {
      activeNetwork = "direct";
    }
  }

  const completionUrl = `${protocol}://${host}/api/complete?id=${id}&network=${activeNetwork}`;

  if (activeNetwork === "direct") {
    return completionUrl;
  }

  try {
    if (activeNetwork === "just") {
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

    if (activeNetwork === "nitrolink") {
      const reqUrl = `https://nitro-link.com/api?api=${config.nitroLinkApiKey}&url=${encodeURIComponent(completionUrl)}`;
      const res = await axios.get(reqUrl, { timeout: 5000 });
      if (res.data?.status === "success" && res.data.shortenedUrl) {
        return res.data.shortenedUrl.replace(/\\\//g, "/");
      }
    }

    if (activeNetwork === "lootlabs") {
      const res = await axios.post(
        "https://creators.lootlabs.gg/api/public/content_locker",
        { title: id, url: completionUrl, tier_id: 1, number_of_tasks: 3, theme: 1 },
        { headers: { Authorization: `Bearer ${config.lootlabsApiKey}`, "Content-Type": "application/json" }, timeout: 5000 }
      );
      const messageData = Array.isArray(res.data?.message) ? res.data.message[0] : res.data?.message;
      const rawUrl = messageData?.loot_url || res.data?.loot_url || completionUrl;
      return rawUrl.replace(/\\\//g, "/");
    } 
    
    if (activeNetwork === "linkvertise") {
      const base64Url = Buffer.from(completionUrl).toString("base64");
      const rnd = Math.random().toString(36).slice(2, 9);
      return `https://link-to.net/${config.linkvertiseUserId}/${rnd}/dynamic?r=${base64Url}`;
    }
  } catch (e) {
    console.error(`Ad Network (${activeNetwork}) Error:`, e.message);
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
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&family=Tajawal:wght@500;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --bg-dark: #0a0d14; --text-main: #ffffff; --theme-blue: #0087FC; }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', 'Tajawal', sans-serif; }
        body { 
          background-color: var(--bg-dark); 
          background-image: radial-gradient(rgba(0, 135, 252, 0.25) 1.5px, transparent 1.5px);
          background-size: 22px 22px;
          display: flex; justify-content: center; align-items: center; min-height: 100vh; color: var(--text-main); padding: 15px; 
        }
        .main-card {
          width: 380px; max-width: 100%; padding: 30px 22px; border-radius: 22px;
          background: #12161f; border: 1px solid rgba(255, 255, 255, 0.08); text-align: center;
          box-shadow: 0 15px 40px rgba(0,0,0,0.6);
        }
        h1 { color: var(--theme-blue); margin-bottom: 10px; font-size: 1.4rem; font-weight: 800; }
        p { color: #8a94a6; font-size: 0.9rem; margin-bottom: 15px; line-height: 1.5; }
        .error-icon { font-size: 50px; color: var(--theme-blue); margin-bottom: 15px; }
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
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Tajawal:wght@700;800&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box;font-family:'Plus Jakarta Sans', 'Tajawal', sans-serif}
  body{background:#0a0d14;display:flex;justify-content:center;align-items:center;min-height:100vh;color:#fff}
  .box{text-align:center}
  h1{font-size:3.5rem;color:#0087FC}
  p{color:#64748b;margin-top:6px}
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
      <span class="step-text" id="stepCounterText">Step 1 of ${totalTasks}</span>
      <div class="step-bar-wrap">
        <div class="step-bar" id="stepBar"></div>
      </div>
    </div>
    
    <div class="tasks-container">
      ${tasks
        .map(
          (task, idx) => `
        <div class="task-card ${idx === 0 ? 'active-step' : 'locked-step'}" id="task-card-${idx}">
          <a href="${task.link}" target="_blank" rel="noopener" class="task-btn" id="task-btn-${idx}" onclick="startTaskTracker(event, ${idx})">
            <div class="task-info">
              <div class="icon-box">
                <i class="fa-brands fa-${task.platform || "youtube"}"></i>
              </div>
              <div class="task-text-wrap">
                <span class="task-title">${task.action}</span>
                <span class="task-sub" id="sub-text-${idx}">${idx === 0 ? 'Click to complete step' : 'Locked (Complete previous step)'}</span>
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


<script src="https://beansnicerroller.com/1c/8c/07/1c8c07e41dacee6cc4a64a6f22c04a4b.js"></script>
<script>(function(s){s.dataset.zone='11383401',s.src='https://al5sm.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title || "Content Locked"}</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Tajawal:wght@500;700;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>
  :root {
    --bg-dark: #07090e;
    --card-bg: #121620;
    --task-bg: #181d2a;
    --theme-blue: #0087FC;
    --theme-blue-hover: #0072dc;
    --text-main: #ffffff;
    --text-sub: #8a94a6;
    --success: #10b981;
    --danger: #ef4444;
  }

  * { 
    margin: 0; 
    padding: 0; 
    box-sizing: border-box; 
    font-family: 'Plus Jakarta Sans', 'Tajawal', -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
    will-change: transform, opacity;
  }

  body {
    background-color: var(--bg-dark);
    background-image: radial-gradient(rgba(0, 135, 252, 0.28) 1.6px, transparent 1.6px);
    background-size: 22px 22px;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 15px;
    color: var(--text-main);
  }

  .main-card {
    width: 380px;
    max-width: 100%;
    padding: 26px 20px;
    border-radius: 22px;
    background: var(--card-bg);
    border: 1px solid rgba(255, 255, 255, 0.07);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    text-align: center;
  }

  .media-thumb {
    width: 100%;
    height: 140px;
    margin: 0 auto 16px auto;
    border-radius: 14px;
    border: 1px solid rgba(0, 135, 252, 0.35);
    object-fit: cover;
    box-shadow: 0 8px 24px rgba(0, 135, 252, 0.2);
  }

  h1 {
    font-size: 1.45rem;
    font-weight: 800;
    color: #ffffff;
    margin-bottom: 6px;
    letter-spacing: -0.3px;
    line-height: 1.3;
  }

  .desc {
    color: var(--text-sub);
    font-size: 0.85rem;
    margin-bottom: 18px;
    font-weight: 500;
    line-height: 1.45;
  }

  .step-indicator {
    margin-bottom: 18px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .step-text {
    font-size: 11.5px;
    color: var(--text-sub);
    font-weight: 700;
    letter-spacing: 0.3px;
    text-transform: uppercase;
  }
  .step-bar-wrap {
    width: 100%;
    height: 5px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 10px;
    overflow: hidden;
  }
  .step-bar {
    width: 0%;
    height: 100%;
    background: var(--theme-blue);
    border-radius: 10px;
    box-shadow: 0 0 12px rgba(0, 135, 252, 0.7);
    transition: width 0.3s ease;
  }

  .tasks-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
  }

  .task-card {
    background: var(--task-bg);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 14px;
    overflow: hidden;
    transition: transform 0.2s ease, border-color 0.2s ease;
  }
  
  .task-card.locked-step {
    opacity: 0.38;
    pointer-events: none;
    filter: grayscale(0.7);
  }

  .task-card.active-step:hover {
    border-color: rgba(0, 135, 252, 0.45);
  }

  .task-btn {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 14px;
    text-decoration: none;
    color: #fff;
  }

  .task-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .icon-box {
    font-size: 18px;
    color: var(--theme-blue);
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
    font-size: 13px;
    color: #fff;
    line-height: 1.25;
  }
  .task-sub {
    font-size: 10.5px;
    color: var(--text-sub);
    margin-top: 2px;
    font-weight: 500;
  }

  .task-action-side {
    display: flex;
    align-items: center;
  }

  .action-circle {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    transition: 0.2s ease;
  }
  .action-circle.arrow {
    background: var(--theme-blue);
    color: #ffffff;
    box-shadow: 0 0 10px rgba(0, 135, 252, 0.4);
  }
  .action-circle.check {
    background: rgba(16, 185, 129, 0.15);
    color: var(--success);
    border: 1px solid var(--success);
  }

  .timer-badge {
    background: rgba(0, 135, 252, 0.15);
    border: 1px solid var(--theme-blue);
    color: var(--theme-blue);
    padding: 4px 9px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 700;
    font-family: 'Plus Jakarta Sans', monospace;
  }

  .task-alert-box {
    font-size: 11px;
    font-weight: 700;
    padding: 0 14px 10px 14px;
    text-align: left;
    display: none;
    line-height: 1.35;
  }
  .task-alert-box.error { color: var(--danger); display: block; }
  .task-alert-box.success { color: var(--success); display: block; }

  .toast-container {
    position: fixed; top: 18px; left: 50%; transform: translateX(-50%);
    z-index: 9999; display: flex; flex-direction: column; gap: 8px; pointer-events: none;
    width: 340px; max-width: 90%;
  }
  .toast {
    background: rgba(18, 22, 32, 0.95); 
    border: 1px solid rgba(0, 135, 252, 0.4); 
    border-left: 4px solid var(--theme-blue);
    color: #fff;
    padding: 12px 18px; 
    border-radius: 14px; 
    font-size: 12.5px; 
    font-weight: 700;
    display: flex; 
    align-items: center; 
    gap: 10px; 
    box-shadow: 0 12px 30px rgba(0,0,0,0.6);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    animation: toastIn 0.25s ease-out;
    direction: rtl;
  }
  .toast.error-toast {
    border-color: rgba(239, 68, 68, 0.4);
    border-left-color: var(--danger);
  }
  @keyframes toastIn { from { opacity: 0; transform: translate(-50%, -15px); } to { opacity: 1; transform: translate(-50%, 0); } }

  .btn {
    width: 100%; padding: 14px; border-radius: 14px; font-size: 14.5px; font-weight: 800;
    text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px;
    border: none; cursor: pointer; transition: transform 0.2s ease, background 0.2s ease;
    letter-spacing: -0.2px;
  }
  .default-btn {
    color: #ffffff;
    background: var(--theme-blue);
    box-shadow: 0 6px 20px rgba(0, 135, 252, 0.35);
  }
  .default-btn:hover:not(.disabled) {
    background: var(--theme-blue-hover);
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 135, 252, 0.5);
  }
  .default-btn.disabled {
    background: #1a1f2c; color: #4a5568; border: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: none; pointer-events: none;
  }

  .footer-brand {
    margin-top: 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 10.5px;
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
    <img src="${image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80'}" class="media-thumb" alt="Thumbnail">
    
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

  let currentActiveIndex = 0;
  let completedTasksCount = 0;
  const taskData = {};

  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSound(type) {
    try {
      initAudio();
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;

      if (type === 'click') {
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1100, now + 0.07);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);
        osc.start(now);
        osc.stop(now + 0.07);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.setValueAtTime(740, now + 0.08);
        osc.frequency.setValueAtTime(960, now + 0.16);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'salawat') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.setValueAtTime(180, now + 0.1);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      }
    } catch(e) {}
  }

  let salawatDone = false;
  function triggerSalawatOnFirstTouch() {
    if (salawatDone) return;
    salawatDone = true;
    playSound('salawat');
    showToast("✨ اللهم صلي وسلم على نبينا محمد ﷺ", false);
  }

  window.addEventListener('click', triggerSalawatOnFirstTouch, { once: true });
  window.addEventListener('touchstart', triggerSalawatOnFirstTouch, { once: true });

  function updateStepUI() {
    const stepText = document.getElementById('stepCounterText');
    const stepBar = document.getElementById('stepBar');
    
    if (totalTasks > 0) {
      const activeStepNumber = Math.min(completedTasksCount + 1, totalTasks);
      if (stepText) stepText.innerText = 'Step ' + activeStepNumber + ' of ' + totalTasks;
      if (stepBar) stepBar.style.width = ((completedTasksCount / totalTasks) * 100) + '%';
    }
  }

  function showToast(message, isError = true) {
    if (isError) playSound('error');
    const toastBox = document.getElementById('toastBox');
    const toast = document.createElement('div');
    toast.className = 'toast' + (isError ? ' error-toast' : '');
    
    const icon = isError ? 'fa-triangle-exclamation' : 'fa-kaaba';
    const iconColor = isError ? '#ef4444' : '#0087FC';
    
    toast.innerHTML = '<i class="fa-solid ' + icon + '" style="color:' + iconColor + '; font-size:15px;"></i> ' + message;
    toastBox.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.25s';
      setTimeout(() => toast.remove(), 250);
    }, 4000);
  }

  // 🟢 تتبع المهمة والعداد المباشر دون الحاجة لضغطتين
  window.startTaskTracker = function(event, index) {
    playSound('click');

    if (index !== currentActiveIndex) {
      event.preventDefault();
      showToast('Please complete the current step first!');
      return;
    }

    if (taskData[index] && taskData[index].completed) return;

    const badge = document.getElementById('timer-badge-' + index);
    const alertBox = document.getElementById('alert-' + index);
    const timerNum = document.getElementById('timer-num-' + index);
    const linkOrb = document.getElementById('link-' + index);
    const subText = document.getElementById('sub-text-' + index);
    
    alertBox.style.display = 'none';

    if (!taskData[index]) {
      taskData[index] = { completed: false, hasLeft: false, timer: null, remaining: taskDuration };
    }
    
    const current = taskData[index];
    current.remaining = taskDuration;
    current.hasLeft = false;

    badge.style.display = 'inline-block';
    linkOrb.style.display = 'none';
    subText.innerText = 'Waiting for completion...';
    timerNum.innerText = current.remaining;

    // تسجيل أن العميل غادر التبويب لتنفيذ المهمة
    const onVisibilityChange = () => {
      if (document.hidden) {
        current.hasLeft = true;
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    if (current.timer) clearInterval(current.timer);

    current.timer = setInterval(() => {
      current.remaining--;
      timerNum.innerText = current.remaining;

      if (current.remaining <= 0) {
        clearInterval(current.timer);
        document.removeEventListener('visibilitychange', onVisibilityChange);

        // إذا أتم الثواني مع خروج حقيقي للتبويب الخارجي
        if (current.hasLeft || document.hidden) {
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
    playSound('success');

    const badge = document.getElementById('timer-badge-' + index);
    const alertBox = document.getElementById('alert-' + index);
    const checkOrb = document.getElementById('check-' + index);
    const subText = document.getElementById('sub-text-' + index);
    const currentCard = document.getElementById('task-card-' + index);

    taskData[index].completed = true;
    completedTasksCount++;

    badge.style.display = 'none';
    checkOrb.style.display = 'flex';
    subText.innerText = 'Step Completed!';
    subText.style.color = '#10b981';

    alertBox.className = 'task-alert-box success';
    alertBox.innerHTML = '<i class="fa-solid fa-circle-check"></i> Completed!';

    currentCard.classList.remove('active-step');
    
    currentActiveIndex++;
    if (currentActiveIndex < totalTasks) {
      const nextCard = document.getElementById('task-card-' + currentActiveIndex);
      const nextSubText = document.getElementById('sub-text-' + currentActiveIndex);
      if (nextCard) {
        nextCard.classList.remove('locked-step');
        nextCard.classList.add('active-step');
      }
      if (nextSubText) {
        nextSubText.innerText = 'Click to complete step';
      }
    }

    updateStepUI();

    if (completedTasksCount >= totalTasks) {
      const btn = document.getElementById('unlockBtn');
      if (btn) {
        btn.classList.remove('disabled');
        document.getElementById('unlockIcon').className = 'fa-solid fa-lock-open';
      }
    }
  }

  window.handleUnlockClick = function(event) {
    playSound('click');
    const btn = document.getElementById('unlockBtn');
    if (btn.classList.contains('disabled')) {
      event.preventDefault();
      showToast('Please complete all steps first!');
    }
  };

  updateStepUI();
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
