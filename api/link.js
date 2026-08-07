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
};

/* ========================== 2) AD NETWORKS ========================== */

async function resolveUnlockUrl(network, targetUrl, slug) {
  try {
    if (network === "lootlabs") {
      const res = await axios.post(
        "https://creators.lootlabs.gg/api/public/content_locker",
        { title: slug, url: targetUrl, tier_id: 1, number_of_tasks: 3, theme: 1 },
        { headers: { Authorization: `Bearer ${config.lootlabsApiKey}` }, timeout: 5000 }
      );
      return res.data?.message?.loot_url || res.data?.loot_url || targetUrl;
    } 
    
    if (network === "linkvertise") {
      const base64Url = Buffer.from(targetUrl).toString("base64");
      const rnd = Math.random().toString(36).slice(2, 9);
      return `https://link-to.net/${config.linkvertiseUserId}/${rnd}/dynamic?r=${base64Url}`;
    }

    if (network === "nitrolink") {
      const res = await axios.get(`https://nitro-link.com/api?api=${config.nitroLinkApiKey}&url=${encodeURIComponent(targetUrl)}`, { timeout: 5000 });
      if (res.data?.status === "success") return res.data.shortenedUrl;
    }

    if (network === "just") {
      const res = await axios.get(`https://linkjust.com/api?api=${config.linkJustApiToken}&url=${encodeURIComponent(targetUrl)}`, { timeout: 5000 });
      if (res.data?.status === "success") return res.data.shortenedUrl;
    }
  } catch (e) {
    console.error("Ad Network Error:", e.message);
  }
  return targetUrl;
}

/* ============================== 3) UI TEMPLATE ============================== */

const generateHtml = (data, unlockUrl, taskDuration) => {
  const { title, description, image, tasks = [], isTextContent = false } = data;
  const totalTasks = tasks.length;

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title || "فتح المحتوى"}</title>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>
  :root {
    --bg-dark: #050811;
    --card-bg: rgba(10, 18, 32, 0.85);
    --primary-cyan: #00f0ff;
    --primary-blue: #0077ff;
    --text-white: #ffffff;
    --success-green: #00ff88;
    --error-red: #ff4d4d;
    --warn-yellow: #ffaa00;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Tajawal', sans-serif; }

  body {
    background-color: var(--bg-dark);
    background-image: 
      radial-gradient(at 10% 10%, rgba(0, 119, 255, 0.15) 0px, transparent 50%),
      radial-gradient(at 90% 90%, rgba(0, 240, 255, 0.1) 0px, transparent 50%);
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--text-white);
    padding: 20px;
  }

  .card {
    width: 460px;
    max-width: 100%;
    background: var(--card-bg);
    border: 1px solid rgba(0, 240, 255, 0.2);
    border-radius: 24px;
    padding: 30px 24px;
    text-align: center;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(20px);
  }

  .thumb { width: 100%; max-height: 180px; object-fit: cover; border-radius: 16px; margin-bottom: 15px; border: 1px solid rgba(0, 240, 255, 0.2); }
  h1 { font-size: 1.5rem; color: var(--primary-cyan); margin-bottom: 8px; font-weight: 800; }
  p.desc { font-size: 0.9rem; color: #94a3b8; margin-bottom: 20px; }

  .tasks-list { text-align: right; margin-bottom: 20px; }
  .tasks-list h3 { font-size: 14px; color: var(--primary-cyan); margin-bottom: 10px; }

  .task-item { margin-bottom: 12px; }
  .task-btn {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(15, 25, 45, 0.7);
    border: 1px solid rgba(0, 240, 255, 0.15);
    padding: 14px 16px;
    border-radius: 14px;
    color: #fff;
    text-decoration: none;
    font-weight: 700;
    font-size: 14px;
    transition: 0.3s;
  }
  .task-btn:hover { border-color: var(--primary-cyan); background: rgba(0, 240, 255, 0.1); }
  .task-btn.done { border-color: var(--success-green); background: rgba(0, 255, 136, 0.1); color: var(--success-green); pointer-events: none; }
  .task-btn.active { border-color: var(--warn-yellow); background: rgba(255, 170, 0, 0.1); color: var(--warn-yellow); }

  .badge { background: var(--warn-yellow); color: #000; font-size: 11px; padding: 2px 8px; border-radius: 6px; font-weight: 800; }

  .alert { font-size: 12px; font-weight: 700; margin-top: 6px; padding: 8px; border-radius: 8px; display: none; text-align: right; }
  .alert.error { background: rgba(255, 77, 77, 0.15); color: var(--error-red); border: 1px solid rgba(255, 77, 77, 0.3); display: block; }
  .alert.success { background: rgba(0, 255, 136, 0.15); color: var(--success-green); border: 1px solid rgba(0, 255, 136, 0.3); display: block; }

  .unlock-btn {
    width: 100%;
    padding: 16px;
    border-radius: 14px;
    border: none;
    background: linear-gradient(135deg, var(--primary-cyan), var(--primary-blue));
    color: #000;
    font-size: 16px;
    font-weight: 800;
    cursor: pointer;
    transition: 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .unlock-btn.disabled { opacity: 0.4; cursor: not-allowed; background: #334155; color: #94a3b8; }

  .text-box { display: none; margin-top: 15px; }
  .text-box textarea { width: 100%; height: 90px; background: rgba(0,0,0,0.5); border: 1px solid var(--primary-cyan); border-radius: 10px; color: #fff; padding: 10px; font-size: 14px; outline: none; }
</style>
</head>
<body>

<div class="card">
  ${image ? `<img src="${image}" class="thumb">` : ''}
  <h1>${title || "محتوى محمي"}</h1>
  ${description ? `<p class="desc">${description}</p>` : ''}

  ${totalTasks > 0 ? `
    <div class="tasks-list">
      <h3><i class="fa-solid fa-list-check"></i> نفذ المهام التالية للفتح:</h3>
      ${tasks.map((task, i) => `
        <div class="task-item">
          <a href="${task.link}" target="_blank" class="task-btn" id="btn-${i}" onclick="runTask(${i})">
            <span><i class="fa-brands fa-${task.platform || 'link'}"></i> ${task.action}</span>
            <span class="badge" id="badge-${i}" style="display:none;">0s / ${taskDuration}s</span>
            <i class="fa-solid fa-circle-check" id="check-${i}" style="display:none;"></i>
          </a>
          <div class="alert" id="alert-${i}"></div>
        </div>
      `).join('')}
    </div>
  ` : ''}

  <button id="unlockBtn" class="unlock-btn ${totalTasks > 0 ? 'disabled' : ''}" onclick="unlock()">
    <i class="fa-solid fa-lock" id="lockIcon"></i> فتح المحتوى الآن
  </button>

  <div class="text-box" id="textBox">
    <textarea id="txtVal" readonly>${isTextContent ? unlockUrl : ''}</textarea>
    <button class="unlock-btn" style="margin-top:8px; padding:10px;" onclick="copyTxt()"><i class="fa-solid fa-copy"></i> نسخ النص</button>
  </div>
</div>

<script>
  const total = ${totalTasks};
  const dur = ${taskDuration};
  const isText = ${Boolean(isTextContent)};
  const finalUrl = "${unlockUrl}";

  let doneCount = 0;
  const state = {};

  function runTask(i) {
    if (state[i]?.completed) return;

    const btn = document.getElementById('btn-' + i);
    const badge = document.getElementById('badge-' + i);
    const alertBox = document.getElementById('alert-' + i);

    alertBox.className = 'alert';
    alertBox.style.display = 'none';

    state[i] = { completed: false, count: 0, timer: null, timeOut: false };

    btn.className = 'task-btn active';
    badge.style.display = 'inline-block';
    badge.innerText = '0s / ' + dur + 's';

    // بدء العداد التنازلي التفاعلي
    state[i].timer = setInterval(() => {
      state[i].count++;
      badge.innerText = state[i].count + 's / ' + dur + 's';

      if (state[i].count >= dur) {
        clearInterval(state[i].timer);
        finishTask(i);
      }
    }, 1000);

    // التحقق عند العودة التلقائية من الصفحة الخارجية
    const onFocus = () => {
      window.removeEventListener('focus', onFocus);
      setTimeout(() => {
        if (!state[i].completed) {
          clearInterval(state[i].timer);
          btn.className = 'task-btn';
          badge.style.display = 'none';
          alertBox.className = 'alert error';
          alertBox.innerText = '❌ فشلت المهمة! يجب البقاء داخل الصفحة لمدة ' + dur + ' ثوانٍ على الأقل.';
        }
      }, 300);
    };

    window.addEventListener('focus', onFocus);
  }

  function finishTask(i) {
    state[i].completed = true;
    doneCount++;

    const btn = document.getElementById('btn-' + i);
    const badge = document.getElementById('badge-' + i);
    const check = document.getElementById('check-' + i);
    const alertBox = document.getElementById('alert-' + i);

    btn.className = 'task-btn done';
    badge.style.display = 'none';
    check.style.display = 'inline-block';

    alertBox.className = 'alert success';
    alertBox.innerText = '✅ تم إتمام المهمة بنجاح!';

    if (doneCount >= total) {
      const uBtn = document.getElementById('unlockBtn');
      uBtn.classList.remove('disabled');
      document.getElementById('lockIcon').className = 'fa-solid fa-lock-open';
    }
  }

  function unlock() {
    const uBtn = document.getElementById('unlockBtn');
    if (uBtn.classList.contains('disabled')) {
      alert('من فضلك أكمل جميع المهام أولاً!');
      return;
    }

    if (isText) {
      uBtn.style.display = 'none';
      document.getElementById('textBox').style.display = 'block';
    } else {
      window.location.href = finalUrl;
    }
  }

  function copyTxt() {
    const t = document.getElementById('txtVal');
    t.select();
    navigator.clipboard.writeText(t.value);
    alert('تم النسخ بنجاح!');
  }
</script>
</body>
</html>
  `;
};

/* ============================== 4) API HANDLER ============================== */

export default async function handler(req, res) {
  try {
    // 1. إنشاء الرابط
    if (req.method === "POST") {
      const { title, description, image, targetUrl, monetization, tasks, slug } = req.body || {};
      if (!targetUrl || !title) return res.status(400).json({ success: false, message: "العنوان والرابط مطلوبان" });

      const id = slug?.trim() ? slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "") : nanoid(6);
      const isTextContent = !targetUrl.trim().startsWith("http://") && !targetUrl.trim().startsWith("https://");

      await db.collection("links").doc(id).set({
        title,
        description: description || "",
        image: image || "",
        targetUrl,
        isTextContent,
        monetization: monetization || "just",
        tasks: Array.isArray(tasks) ? tasks : [],
        createdAt: Date.now()
      });

      return res.status(200).json({ success: true, short: `${req.headers.origin}/${id}` });
    }

    // 2. عرض الرابط وتخطي الإعلانات
    if (req.method === "GET") {
      const id = req.query.id;
      if (!id) return res.status(404).send("Not Found");

      const doc = await db.collection("links").doc(id).get();
      if (!doc.exists) return res.status(404).send("الصفحة غير موجودة");

      const data = doc.data();
      let unlockUrl = data.targetUrl;

      if (!data.isTextContent) {
        unlockUrl = await resolveUnlockUrl(data.monetization, data.targetUrl, id);
      }

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(generateHtml(data, unlockUrl, config.taskDurationSeconds));
    }

    return res.status(405).send("Method Not Allowed");
  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}
