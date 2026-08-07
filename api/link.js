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
  taskDurationSeconds: Number(process.env.TASK_DURATION_SECONDS || 5),
  vpnCheckEnabled: (process.env.VPN_CHECK_ENABLED ?? "true") === "true",
};

/* ========================== 2) AD NETWORK HANDLERS ========================== */

async function callLootLabs(targetUrl, slug) {
  const response = await axios.post(
    "https://creators.lootlabs.gg/api/public/content_locker",
    { title: slug, url: targetUrl, tier_id: 1, number_of_tasks: 3, theme: 1 },
    { headers: { Authorization: `Bearer ${config.lootlabsApiKey}`, "Content-Type": "application/json" }, timeout: 8000 }
  );
  const url = response.data?.message?.loot_url || response.data?.loot_url;
  if (!url) throw new Error("LootLabs API Failed");
  return { unlockUrl: url, isClientSide: false };
}

async function callLinkvertise(targetUrl) {
  const base64Url = Buffer.from(targetUrl).toString("base64");
  const randomString = Math.random().toString(36).slice(2, 9);
  const url = `https://link-to.net/${config.linkvertiseUserId}/${randomString}/dynamic?r=${base64Url}`;
  return { unlockUrl: url, isClientSide: false };
}

async function callNitroLink(targetUrl) {
  const reqUrl = `https://nitro-link.com/api?api=${config.nitroLinkApiKey}&url=${encodeURIComponent(targetUrl)}`;
  const response = await axios.get(reqUrl, { timeout: 8000 });
  if (response.data?.status !== "success" || !response.data?.shortenedUrl) {
    throw new Error("Nitro Link API Failed");
  }
  return { unlockUrl: response.data.shortenedUrl, isClientSide: false };
}

async function callLinkJust(targetUrl) {
  const reqUrl = `https://linkjust.com/api?api=${config.linkJustApiToken}&url=${encodeURIComponent(targetUrl)}`;
  const response = await axios.get(reqUrl, { timeout: 8000 });
  if (response.data?.status === "success" && response.data?.shortenedUrl) {
    return { unlockUrl: response.data.shortenedUrl, isClientSide: false };
  }
  return { unlockUrl: targetUrl, isClientSide: true };
}

const NETWORK_HANDLERS = {
  lootlabs: callLootLabs,
  linkvertise: callLinkvertise,
  nitrolink: callNitroLink,
  just: callLinkJust,
  direct: async (targetUrl) => ({ unlockUrl: targetUrl, isClientSide: false }),
};

async function resolveUnlockUrl(network, targetUrl, slug) {
  const handler = NETWORK_HANDLERS[network] || NETWORK_HANDLERS.direct;
  try {
    return await handler(targetUrl, slug);
  } catch (err) {
    console.error(`${network} Network Error:`, err.message);
    return { unlockUrl: targetUrl, isClientSide: network === "just" };
  }
}

/* ============================== 3) TEMPLATES ============================== */

const vpnBlockPage = () => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>VPN Detected 🛡️</title>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>
  :root{--bg-dark:#050811;--glass-bg:rgba(10,18,32,.75);--text-main:#fff}
  *{margin:0;padding:0;box-sizing:border-box;font-family:'Tajawal',sans-serif}
  body{background:var(--bg-dark);display:flex;justify-content:center;align-items:center;min-height:100vh;color:var(--text-main);padding:20px}
  .container{width:480px;max-width:100%;padding:40px 35px;border-radius:28px;background:var(--glass-bg);backdrop-filter:blur(20px);border:1px solid rgba(0,240,255,.3);text-align:center;box-shadow:0 25px 50px rgba(0,0,0,.8)}
  h1{color:#00f0ff;margin-bottom:15px;font-size:1.8rem;font-weight:800}
  p{color:#aaa;font-size:1.1rem;margin-bottom:20px;line-height:1.6}
  .error-icon{font-size:70px;color:#00f0ff;margin-bottom:25px;text-shadow:0 0 20px rgba(0,240,255,.4)}
</style>
</head>
<body>
  <div class="container">
    <div class="error-icon"><i class="fa-solid fa-shield-halved"></i></div>
    <h1>VPN / Proxy Detected!</h1>
    <p>We detected that you are using a VPN or Proxy connection.</p>
    <p style="color:#fff;font-weight:bold;">Please turn off your VPN and refresh the page to continue.</p>
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

const unlockPage = ({ linkData, unlockUrl, isClientSide, taskDurationSeconds }) => {
  const { title, description, image, tasks = [], isTextContent = false } = linkData;
  const totalTasks = tasks.length;
  const dur = taskDurationSeconds;

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
            <span class="task-timer-badge" id="timer-badge-${idx}" style="display:none;">0s / ${dur}s</span>
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
    animation:riseIn .5s ease;
  }
  @keyframes riseIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
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
  .task-btn:hover{background:rgba(0,136,255,.2);border-color:var(--accent-cyan);box-shadow:0 0 15px rgba(0,240,255,.2)}
  .task-btn.completed{border-color:var(--success);background:rgba(0,255,136,.08);color:var(--success);pointer-events:none}
  .task-btn.active-timer{border-color:var(--warn);background:rgba(255,170,0,.08);color:var(--warn)}
  .task-info{display:flex;align-items:center;gap:8px}
  .task-timer-badge{background:var(--warn);color:#000;font-size:11px;font-weight:800;padding:2px 8px;border-radius:8px;flex-shrink:0}
  .check-icon{color:var(--success)}

  .task-alert-box{font-size:12px;font-weight:700;margin-top:6px;padding:8px 12px;border-radius:10px;display:none;animation:fadeIn .3s}
  .task-alert-box.error{background:rgba(255,92,92,.12);border:1px solid rgba(255,92,92,.3);color:var(--danger);display:block}
  .task-alert-box.success{background:rgba(0,255,136,.12);border:1px solid rgba(0,255,136,.3);color:var(--success);display:block}
  @keyframes fadeIn{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}

  .text-box-container{display:none;margin-top:15px;background:rgba(0,0,0,0.4);border:1px solid rgba(0,240,255,0.3);border-radius:16px;padding:15px;text-align:left}
  .text-box-container textarea{width:100%;background:transparent;border:none;color:#fff;font-size:14px;resize:none;outline:none;font-family:monospace}

  .btn{width:100%;padding:17px;border-radius:16px;font-size:15.5px;font-weight:800;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:10px;border:none;cursor:pointer;transition:all .25s}
  .default-btn{color:#050811;background:linear-gradient(135deg,#00f0ff 0%,#0077ff 100%);box-shadow:0 6px 20px rgba(0,136,255,.3)}
  .default-btn:hover:not(.disabled){transform:translateY(-2px);box-shadow:0 10px 25px rgba(0,240,255,.4)}
  .default-btn.disabled{background:rgba(255,255,255,.08);color:#475569;cursor:not-allowed;box-shadow:none;transform:none}
  .footnote{margin-top:14px;font-size:11px;color:#475569}
</style>
</head>
<body>
  <div class="container">
    ${image ? `<img src="${image}" class="media-img" alt="Thumbnail" loading="lazy">` : ""}
    <h1>${title || "Locked Content"}</h1>
    ${description ? `<p class="desc">${description}</p>` : ""}
    
    ${tasksHtml}

    <button id="unlockBtn" class="btn default-btn ${totalTasks > 0 ? "disabled" : ""}" onclick="handleUnlockClick()">
      <i class="fa-solid fa-lock" id="unlockIcon"></i> <span id="unlockText">Unlock Content</span>
    </button>

    <div class="text-box-container" id="textContentBox">
      <textarea id="secretText" readonly rows="4">${unlockUrl}</textarea>
      <button class="btn default-btn" style="margin-top:10px; padding:12px;" onclick="copySecretText()">
        <i class="fa-solid fa-copy"></i> Copy Hidden Content
      </button>
    </div>

    <p class="footnote">Complete all tasks to gain access.</p>
  </div>

<script>
(function(){
  const totalTasks = ${totalTasks};
  const unlockTargetUrl = ${JSON.stringify(unlockUrl)};
  const isClientSide = ${Boolean(isClientSide)};
  const taskDuration = ${dur};
  const isTextContent = ${Boolean(isTextContent)};

  let completedTasksCount = 0;
  const taskData = {};

  window.startTaskTracker = function(index) {
    if (taskData[index] && taskData[index].completed) return;

    const taskBtn = document.getElementById('task-btn-' + index);
    const badge = document.getElementById('timer-badge-' + index);
    const alertBox = document.getElementById('alert-' + index);
    alertBox.style.display = 'none';

    if (!taskData[index]) {
      taskData[index] = { completed: false, startTime: 0, timer: null, seconds: 0 };
    }
    
    const current = taskData[index];
    current.startTime = Date.now();
    current.seconds = 0;

    taskBtn.className = 'task-btn active-timer';
    badge.style.display = 'inline-block';
    badge.innerText = '0s / ' + taskDuration + 's';

    if (current.timer) clearInterval(current.timer);

    current.timer = setInterval(() => {
      current.seconds++;
      badge.innerText = current.seconds + 's / ' + taskDuration + 's';

      if (current.seconds >= taskDuration) {
        clearInterval(current.timer);
        completeTask(index);
      }
    }, 1000);

    const checkVisibility = () => {
      if (document.visibilityState === 'visible' && !current.completed) {
        document.removeEventListener('visibilitychange', checkVisibility);
        const timeSpent = (Date.now() - current.startTime) / 1000;
        
        if (timeSpent < taskDuration) {
          clearInterval(current.timer);
          taskBtn.className = 'task-btn';
          badge.style.display = 'none';
          alertBox.className = 'task-alert-box error';
          alertBox.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Task failed! Stay at least ' + taskDuration + ' seconds on the task page.';
        }
      }
    };

    document.addEventListener('visibilitychange', checkVisibility);
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
    alertBox.innerHTML = '<i class="fa-solid fa-circle-check"></i> Task completed!';

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

  window.handleUnlockClick = async function() {
    const btn = document.getElementById('unlockBtn');
    if (btn.classList.contains('disabled')) {
      alert('Please complete all required tasks first!');
      return;
    }

    if (isTextContent) {
      btn.style.display = 'none';
      document.getElementById('textContentBox').style.display = 'block';
      return;
    }

    if (isClientSide) {
      btn.classList.add('disabled');
      document.getElementById('unlockText').innerText = 'Resolving short link...';
      document.getElementById('unlockIcon').className = 'fa-solid fa-spinner fa-spin';

      try {
        const res = await fetch('/api/link?id=RESOLVE&target=' + encodeURIComponent(unlockTargetUrl));
        const data = await res.json();
        if (data.success && data.url) {
          window.location.href = data.url;
          return;
        }
      } catch (err) {
        console.error('Resolve error:', err);
      }
    }
    window.location.href = unlockTargetUrl;
  };

  window.copySecretText = function() {
    const text = document.getElementById("secretText");
    text.select();
    navigator.clipboard.writeText(text.value);
    alert("Copied to clipboard!");
  };

  if (totalTasks === 0) updateProgress();
})();
</script>
</body>
</html>`;
};

/* ============================== 4) HELPERS ============================== */

const spamCache = new Map();
const settingsCache = new Map();

function getClientIp(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
}

function isRateLimited(ip) {
  const now = Date.now();
  const entry = spamCache.get(ip) || { count: 0, startTime: now };
  if (now - entry.startTime > config.rateLimitWindowMs) {
    entry.count = 1;
    entry.startTime = now;
  } else {
    entry.count++;
  }
  spamCache.set(ip, entry);
  return entry.count > config.rateLimitMaxRequests;
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

/* ============================== 5) ROUTE HANDLERS ============================== */

async function handlePatch(req, res) {
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
  settingsCache.set("adSettings", settings);
  return res.status(200).json({ success: true, message: "Settings updated successfully", settings });
}

async function handlePost(req, res) {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return res.status(429).json({ success: false, message: "Too many requests, please slow down." });
  }

  const { title, description, image, targetUrl, monetization, tasks, slug } = req.body || {};
  if (!targetUrl || !title) {
    return res.status(400).json({ success: false, message: "Title and Target URL / Text are required" });
  }

  const id = slug?.trim() ? slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "") : nanoid(6);
  if (!id) return res.status(400).json({ success: false, message: "Invalid alias" });

  const existing = await db.collection("links").doc(id).get();
  if (existing.exists) {
    return res.status(400).json({ success: false, message: "Alias already in use" });
  }

  // 🛠️ الإصلاح الجذري للروابط والأكواد والمحتويات المقفولة
  const trimmedUrl = targetUrl.trim();
  const isTextContent = !trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://");

  await db.collection("links").doc(id).set({
    title,
    description: description || "",
    image: image || "",
    targetUrl: trimmedUrl,
    isTextContent,
    monetization: monetization || "lootlabs",
    tasks: Array.isArray(tasks) ? tasks : [],
    createdAt: Date.now(),
    clicks: 0,
  });

  return res.status(200).json({ success: true, short: `${req.headers.origin}/${id}` });
}

async function handleGet(req, res) {
  const ip = getClientIp(req);

  if (await checkIsVpn(ip)) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(403).send(vpnBlockPage());
  }

  const id = req.query.id;

  if (id === "RESOLVE") {
    const target = req.query.target;
    if (!target) return res.status(400).json({ success: false, message: "Missing target" });
    const { unlockUrl } = await callLinkJust(target).catch(() => ({ unlockUrl: target }));
    return res.status(200).json({ success: true, url: unlockUrl });
  }

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
  db.collection("links").doc(id).update({ clicks: (data.clicks || 0) + 1 }).catch(() => {});

  let unlockUrl = data.targetUrl;
  let isClientSide = false;

  // التعامل الصحيح مع الروابط المقفولة مقابل الأكواد والنصوص
  if (!data.isTextContent) {
    const network = data.monetization || "lootlabs";
    const resolved = await resolveUnlockUrl(network, data.targetUrl, id);
    unlockUrl = resolved.unlockUrl;
    isClientSide = resolved.isClientSide;
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.status(200).send(
    unlockPage({ 
      linkData: data, 
      unlockUrl, 
      isClientSide, 
      taskDurationSeconds: config.taskDurationSeconds 
    })
  );
}

/* ============================== 6) MAIN EXPORT ============================== */

export default async function handler(req, res) {
  try {
    if (req.method === "PATCH") return await handlePatch(req, res);
    if (req.method === "POST") return await handlePost(req, res);
    if (req.method === "GET") return await handleGet(req, res);
    return res.status(405).send("Method Not Allowed");
  } catch (err) {
    console.error("Handler error:", err);
    if (req.method === "GET") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(500).send(notFoundPage());
    }
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

  return res.status(200).json({ success: true, short: `${req.headers.origin}/${id}` });
}

async function handleGet(req, res) {
  const ip = getClientIp(req);

  if (await checkIsVpn(ip)) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(403).send(vpnBlockPage());
  }

  const id = req.query.id;

  if (id === "RESOLVE") {
    const target = req.query.target;
    if (!target) return res.status(400).json({ success: false, message: "Missing target" });
    const { unlockUrl } = await callLinkJust(target).catch(() => ({ unlockUrl: target }));
    return res.status(200).json({ success: true, url: unlockUrl });
  }

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
  db.collection("links").doc(id).update({ clicks: (data.clicks || 0) + 1 }).catch(() => {});

  let unlockUrl = data.targetUrl;
  let isClientSide = false;

  if (!data.isTextContent) {
    const network = data.monetization || "lootlabs";
    const resolved = await resolveUnlockUrl(network, data.targetUrl, id);
    unlockUrl = resolved.unlockUrl;
    isClientSide = resolved.isClientSide;
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.status(200).send(
    unlockPage({ 
      linkData: data, 
      unlockUrl, 
      isClientSide, 
      taskDurationSeconds: config.taskDurationSeconds 
    })
  );
}

/* ============================== 6) MAIN EXPORT ============================== */

export default async function handler(req, res) {
  try {
    if (req.method === "PATCH") return await handlePatch(req, res);
    if (req.method === "POST") return await handlePost(req, res);
    if (req.method === "GET") return await handleGet(req, res);
    return res.status(405).send("Method Not Allowed");
  } catch (err) {
    console.error("Handler error:", err);
    if (req.method === "GET") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(500).send(notFoundPage());
    }
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}
