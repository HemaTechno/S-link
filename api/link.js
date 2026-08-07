import db from "./firebase.js";
import { nanoid } from "nanoid";
import axios from "axios";

// 🔑 مفاتيح الشبكات الحالية
const LOOTLABS_API = "d2cc58f8084e256f9a15e41ab3971855c0289ed29a00dbf681e31b8b237ace81";
const LINKVERTISE_USER_ID = "1322389"; 
const NITRO_LINK_API = "21a96ba57ee7a54bbbfbb7f0b180901f8f8a3ec9"; 
const LINKJUST_API_TOKEN = "944c5ea148b949eb99be07963d8615e6904f460b";

const cache = new Map();
const spamCache = new Map(); 

const RATE_LIMIT_WINDOW = 60 * 1000; 
const MAX_REQUESTS = 5;

// 🛡️ واجهة منع الـ VPN
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
</html>
`;

// 🎨 توليد واجهة المستخدم التفاعلية التي تعرض المهام وزر Unlock
const generatePageHtml = (linkData, unlockUrl, isClientLinkJust = false) => {
    const { title, description, image, targetUrl, tasks } = linkData;

    // بناء كود قائمة المهام
    let tasksHtml = '';
    const totalTasks = tasks ? tasks.length : 0;

    if (totalTasks > 0) {
        tasksHtml = `
        <div class="tasks-container">
            <h3><i class="fa-solid fa-list-check"></i> Complete Tasks to Unlock</h3>
            ${tasks.map((task, idx) => `
                <a href="${task.link}" target="_blank" class="task-btn" id="task-btn-${idx}" onclick="markTaskDone(${idx})">
                    <span><i class="fa-brands fa-${task.platform}"></i> ${task.action}</span>
                    <i class="fa-solid fa-circle-check check-icon" id="check-${idx}" style="display:none; color:#4ade80;"></i>
                    <i class="fa-solid fa-external-link-alt link-icon" id="link-${idx}"></i>
                </a>
            `).join('')}
        </div>`;
    }

    // بناء زر الـ Unlock التفاعلي
    let unlockButtonHtml = '';
    if (isClientLinkJust) {
        unlockButtonHtml = `
        <button id="unlockBtn" class="btn default-btn disabled" onclick="unlockClientSideLinkJust()">
            <i class="fa-solid fa-lock"></i> Unlock Content
        </button>
        <script>
            async function unlockClientSideLinkJust() {
                const btn = document.getElementById('unlockBtn');
                if (btn.classList.contains('disabled')) return;

                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating Short Link...';
                btn.disabled = true;

                const target = "${unlockUrl}";
                const apiUrl = "https://linkjust.com/api?api=${LINKJUST_API_TOKEN}&url=" + encodeURIComponent(target);
                
                try {
                    const res = await fetch(apiUrl);
                    const data = await res.json();
                    if(data.status === 'success' && data.shortenedUrl) {
                        window.location.href = data.shortenedUrl;
                        return;
                    }
                } catch(err) {
                    console.error("LinkJust Client API Error:", err);
                }
                window.location.href = target;
            }
        </script>`;
    } else {
        unlockButtonHtml = `
        <a id="unlockBtn" href="${unlockUrl}" class="btn default-btn ${totalTasks > 0 ? 'disabled' : ''}" onclick="checkTasksBeforeUnlock(event)">
            <i class="fa-solid fa-lock" id="unlockIcon"></i> Unlock Content
        </a>`;
    }

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
        :root { --primary: #ffd700; --bg-dark: #0c0d10; --glass-bg: rgba(20, 21, 25, 0.7); --text-main: #ffffff; }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
        body { background-color: var(--bg-dark); display: flex; justify-content: center; align-items: center; min-height: 100vh; color: var(--text-main); padding: 20px; }
        
        .container { 
            width: 480px; max-width: 100%; padding: 35px 25px; border-radius: 28px; 
            background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); 
            border: 1px solid rgba(255, 255, 255, 0.08); text-align: center; 
            box-shadow: 0 25px 50px rgba(0,0,0,0.5); 
        }
        
        .media-img { width: 100%; max-height: 200px; object-fit: cover; border-radius: 16px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.1); }
        h1 { color: var(--primary); margin-bottom: 10px; font-size: 1.6rem; font-weight: 800; }
        .desc { color: #a0a0a0; margin-bottom: 25px; font-size: 0.95rem; line-height: 1.5; }
        
        .tasks-container { margin-bottom: 25px; text-align: left; }
        .tasks-container h3 { font-size: 14px; color: var(--primary); margin-bottom: 12px; font-weight: bold; }
        .task-btn {
            display: flex; justify-content: space-between; align-items: center;
            background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 14px 18px; border-radius: 14px; color: #fff; text-decoration: none;
            margin-bottom: 10px; font-weight: bold; font-size: 14px; transition: 0.3s;
        }
        .task-btn:hover { background: rgba(255, 215, 0, 0.1); border-color: var(--primary); }
        .task-btn.completed { border-color: #4ade80; background: rgba(74, 222, 128, 0.1); color: #4ade80; }

        .btn { width: 100%; padding: 18px; border-radius: 16px; font-size: 16px; font-weight: 800; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 10px; border: none; cursor: pointer; transition: all 0.3s; }
        .default-btn { color: #000; background: linear-gradient(135deg, var(--primary) 0%, #b89b00 100%); box-shadow: 0 6px 20px rgba(255, 215, 0, 0.2); }
        .default-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(255, 215, 0, 0.35); }
        .default-btn.disabled { background: rgba(255, 255, 255, 0.1); color: #666; cursor: not-allowed; box-shadow: none; transform: none; }
    </style>
</head>
<body>
    <div class="container">
        ${image ? `<img src="${image}" class="media-img" alt="Thumbnail">` : ''}
        <h1>${title || "Locked Content"}</h1>
        ${description ? `<p class="desc">${description}</p>` : ''}
        
        ${tasksHtml}
        ${unlockButtonHtml}
    </div>

    <script>
        const totalTasks = ${totalTasks};
        let completedCount = 0;
        const taskStatus = {};

        function markTaskDone(index) {
            if (!taskStatus[index]) {
                taskStatus[index] = true;
                completedCount++;
                
                const taskBtn = document.getElementById('task-btn-' + index);
                const checkIcon = document.getElementById('check-' + index);
                const linkIcon = document.getElementById('link-' + index);

                if (taskBtn) taskBtn.classList.add('completed');
                if (checkIcon) checkIcon.style.display = 'inline-block';
                if (linkIcon) linkIcon.style.display = 'none';

                checkTasksCompletion();
            }
        }

        function checkTasksCompletion() {
            if (completedCount >= totalTasks) {
                const btn = document.getElementById('unlockBtn');
                if (btn) {
                    btn.classList.remove('disabled');
                    const unlockIcon = document.getElementById('unlockIcon');
                    if (unlockIcon) unlockIcon.className = 'fa-solid fa-lock-open';
                }
            }
        }

        function checkTasksBeforeUnlock(event) {
            const btn = document.getElementById('unlockBtn');
            if (btn && btn.classList.contains('disabled')) {
                event.preventDefault();
                alert('الرجاء إتمام كافة المهام أولاً لفتح الرابط!');
            }
        }

        // تفعيل الزر تلقائياً في حال عدم وجود مهام
        if (totalTasks === 0) {
            checkTasksCompletion();
        }
    </script>
</body>
</html>
    `;
};

export default async function handler(req, res) {
    // ⚙️ إعدادات الشبكات الإعلانية
    if (req.method === "PATCH") {
        try {
            const { lootlabsEnabled, linkvertiseEnabled, nitrolinkEnabled, adminKey } = req.body;
            if (adminKey !== "MY_SECRET_ADMIN_PASSWORD") return res.status(401).json({ success: false, message: "Unauthorized" });

            const settings = { 
                lootlabs: Boolean(lootlabsEnabled), 
                linkvertise: Boolean(linkvertiseEnabled),
                nitrolink: Boolean(nitrolinkEnabled)
            };
            await db.collection("settings").doc("adNetworks").set(settings);
            cache.set("adSettings", settings);
            return res.status(200).json({ success: true, message: "Settings updated successfully", settings });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    // ➕ إنشاء الرابط وحفظه في Firebase
    if (req.method === "POST") {
        try {
            const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress || "unknown";
            const currentTime = Date.now();
            const userSpamData = spamCache.get(ip) || { count: 0, startTime: currentTime };

            if (currentTime - userSpamData.startTime > RATE_LIMIT_WINDOW) {
                userSpamData.count = 1;
                userSpamData.startTime = currentTime;
            } else {
                userSpamData.count++;
            }
            spamCache.set(ip, userSpamData);

            if (userSpamData.count > MAX_REQUESTS) return res.status(429).json({ success: false, message: "Too many requests!" });

            const { title, description, image, targetUrl, monetization, tasks, slug } = req.body;
            if (!targetUrl || !title) return res.status(400).json({ success: false, message: "Title and Target URL are required" });

            let id = (slug && slug.trim() !== "") ? slug.trim().toLowerCase() : nanoid(6);
            const exists = await db.collection("links").doc(id).get();
            if (exists.exists) return res.status(400).json({ success: false, message: "Alias in use" });

            await db.collection("links").doc(id).set({
                title,
                description: description || "",
                image: image || "",
                targetUrl,
                monetization: monetization || "lootlabs",
                tasks: tasks || [],
                createdAt: Date.now()
            });

            return res.status(200).json({ success: true, short: `${req.headers.origin}/${id}` });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    // 🔗 فتح الرابط وحساب نظام الربح
    if (req.method === "GET") {
        // 🛡️ فحص الـ VPN / Proxy
        const clientIp = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket?.remoteAddress;
        let isVPN = false;
        
        if (clientIp && clientIp !== "::1" && clientIp !== "127.0.0.1") {
            try {
                const response = await axios.get(`https://blackbox.ipinfo.app/lookup/${clientIp}`);
                if (typeof response.data === 'string' && response.data.trim() === 'Y') {
                    isVPN = true;
                }
            } catch (error) {
                console.error("VPN check failed");
            }
        }

        if (isVPN) {
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            return res.status(403).send(vpnBlockUI);
        }

        const id = req.query.id;
        try {
            if (!id) return res.status(404).send("Not Found");

            const doc = await db.collection("links").doc(id).get();
            if (!doc.exists) return res.status(404).send("Content not found");
            const data = doc.data();

            let unlockUrl = data.targetUrl; 
            let isClientLinkJust = false;
            const selectedNetwork = data.monetization || "lootlabs";

            // 💰 تحويل زر Unlock بناءً على نظام الربح المختار
            if (selectedNetwork === "lootlabs") {
                try {
                    const response = await axios.post(
                        "https://creators.lootlabs.gg/api/public/content_locker",
                        { title: id, url: data.targetUrl, tier_id: 1, number_of_tasks: 3, theme: 1 },
                        { headers: { Authorization: `Bearer ${LOOTLABS_API}`, "Content-Type": "application/json" } }
                    );
                    unlockUrl = response.data?.message?.loot_url || response.data?.loot_url || data.targetUrl;
                } catch (err) {
                    console.error("LootLabs API Error:", err.message);
                }
            } else if (selectedNetwork === "linkvertise") {
                const base64Url = Buffer.from(data.targetUrl).toString('base64');
                const randomString = Math.random().toString(36).substring(7);
                unlockUrl = `https://link-to.net/${LINKVERTISE_USER_ID}/${randomString}/dynamic?r=${base64Url}`;
            } else if (selectedNetwork === "nitrolink") {
                try {
                    const reqUrl = `https://nitro-link.com/api?api=${NITRO_LINK_API}&url=${encodeURIComponent(data.targetUrl)}`;
                    const response = await axios.get(reqUrl);
                    if (response.data && response.data.status === 'success') {
                        unlockUrl = response.data.shortenedUrl;
                    }
                } catch (err) {
                    console.error("Nitro Link API Error:", err.message);
                }
            } else if (selectedNetwork === "just") {
                // 🚀 تحويل باستخدام LinkJust API
                try {
                    const linkJustApiUrl = `https://linkjust.com/api?api=${LINKJUST_API_TOKEN}&url=${encodeURIComponent(data.targetUrl)}`;
                    const response = await axios.get(linkJustApiUrl);
                    if (response.data && response.data.status === 'success' && response.data.shortenedUrl) {
                        unlockUrl = response.data.shortenedUrl;
                    } else {
                        isClientLinkJust = true;
                    }
                } catch (err) {
                    console.error("LinkJust Server API Error:", err.message);
                    isClientLinkJust = true;
                }
            }

            res.setHeader("Content-Type", "text/html; charset=utf-8");
            return res.status(200).send(generatePageHtml(data, unlockUrl, isClientLinkJust));

        } catch (err) {
            console.error("Error Details:", err.message);
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            return res.status(500).send("Internal Server Error");
        }
    }

    return res.status(405).send("Method Not Allowed");
}
