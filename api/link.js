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
        :root { --bg-dark: #070a12; --glass-bg: rgba(13, 22, 38, 0.75); --text-main: #ffffff; }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
        body { background-color: var(--bg-dark); display: flex; justify-content: center; align-items: center; min-height: 100vh; color: var(--text-main); padding: 20px; }
        .container { width: 480px; max-width: 100%; padding: 40px 35px; border-radius: 28px; background: var(--glass-bg); backdrop-filter: blur(20px); border: 1px solid rgba(0, 195, 255, 0.3); text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.8); }
        h1 { color: #00c3ff; margin-bottom: 15px; font-size: 1.8rem; font-weight: 800; }
        p { color: #aaa; font-size: 1.1rem; margin-bottom: 20px; line-height: 1.6; }
        .error-icon { font-size: 70px; color: #00c3ff; margin-bottom: 25px; text-shadow: 0 0 20px rgba(0, 195, 255, 0.4); }
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

// 🎨 واجهة العرض بالتصميم الأزرق الفاخر ونظام العد التنازلي التفاعلي
const generatePageHtml = (linkData, unlockUrl, isClientLinkJust = false) => {
    const { title, description, image, targetUrl, tasks } = linkData;
    const totalTasks = tasks ? tasks.length : 0;

    let tasksHtml = '';
    if (totalTasks > 0) {
        tasksHtml = `
        <div class="tasks-container">
            <h3><i class="fa-solid fa-list-check"></i> Complete Required Tasks</h3>
            ${tasks.map((task, idx) => `
                <div class="task-wrapper">
                    <a href="${task.link}" target="_blank" class="task-btn" id="task-btn-${idx}" onclick="startTaskVerification(${idx})">
                        <span><i class="fa-brands fa-${task.platform}"></i> ${task.action}</span>
                        <i class="fa-solid fa-circle-check check-icon" id="check-${idx}" style="display:none; color:#00ff88;"></i>
                        <i class="fa-solid fa-external-link-alt link-icon" id="link-${idx}"></i>
                    </a>
                    <div class="task-status-text" id="status-${idx}"></div>
                </div>
            `).join('')}
        </div>`;
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
        :root { 
            --primary-blue: #0088ff; 
            --accent-cyan: #00f0ff; 
            --bg-dark: #050811; 
            --glass-bg: rgba(10, 18, 32, 0.75); 
            --text-main: #ffffff; 
        }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
        body { 
            background-color: var(--bg-dark); 
            background-image: 
                radial-gradient(at 20% 20%, rgba(0, 136, 255, 0.15) 0px, transparent 50%),
                radial-gradient(at 80% 80%, rgba(0, 240, 255, 0.1) 0px, transparent 50%);
            display: flex; justify-content: center; align-items: center; min-height: 100vh; color: var(--text-main); padding: 20px; 
        }
        
        .container { 
            width: 480px; max-width: 100%; padding: 35px 25px; border-radius: 28px; 
            background: var(--glass-bg); backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px); 
            border: 1px solid rgba(0, 240, 255, 0.15); text-align: center; 
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.1); 
        }
        
        .media-img { width: 100%; max-height: 200px; object-fit: cover; border-radius: 18px; margin-bottom: 20px; border: 1px solid rgba(0, 240, 255, 0.2); }
        h1 { color: var(--accent-cyan); margin-bottom: 10px; font-size: 1.6rem; font-weight: 800; text-shadow: 0 0 15px rgba(0, 240, 255, 0.3); }
        .desc { color: #94a3b8; margin-bottom: 25px; font-size: 0.95rem; line-height: 1.5; }
        
        .tasks-container { margin-bottom: 25px; text-align: left; }
        .tasks-container h3 { font-size: 14px; color: var(--accent-cyan); margin-bottom: 12px; font-weight: bold; }
        .task-wrapper { margin-bottom: 12px; }
        .task-btn {
            display: flex; justify-content: space-between; align-items: center;
            background: rgba(15, 28, 48, 0.6); border: 1px solid rgba(0, 240, 255, 0.15);
            padding: 14px 18px; border-radius: 14px; color: #fff; text-decoration: none;
            font-weight: bold; font-size: 14px; transition: all 0.3s ease;
        }
        .task-btn:hover { background: rgba(0, 136, 255, 0.2); border-color: var(--accent-cyan); box-shadow: 0 0 15px rgba(0, 240, 255, 0.2); }
        .task-btn.completed { border-color: #00ff88; background: rgba(0, 255, 136, 0.1); color: #00ff88; pointer-events: none; }
        .task-btn.verifying { border-color: #ffaa00; background: rgba(255, 170, 0, 0.1); color: #ffaa00; }
        .task-status-text { font-size: 12px; margin-top: 4px; padding-left: 5px; font-weight: 600; display: none; }
        .task-status-text.error { color: #ff4d4d; display: block; }
        .task-status-text.info { color: #ffaa00; display: block; }

        .btn { width: 100%; padding: 18px; border-radius: 16px; font-size: 16px; font-weight: 800; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 10px; border: none; cursor: pointer; transition: all 0.3s; }
        .default-btn { color: #050811; background: linear-gradient(135deg, #00f0ff 0%, #0077ff 100%); box-shadow: 0 6px 20px rgba(0, 136, 255, 0.3); }
        .default-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(0, 240, 255, 0.4); }
        .default-btn.disabled { background: rgba(255, 255, 255, 0.08); color: #475569; cursor: not-allowed; box-shadow: none; transform: none; }
    </style>
</head>
<body>
    <div class="container">
        ${image ? `<img src="${image}" class="media-img" alt="Thumbnail">` : ''}
        <h1>${title || "Locked Content"}</h1>
        ${description ? `<p class="desc">${description}</p>` : ''}
        
        ${tasksHtml}

        <button id="unlockBtn" class="btn default-btn ${totalTasks > 0 ? 'disabled' : ''}" onclick="handleUnlockClick()">
            <i class="fa-solid fa-lock" id="unlockIcon"></i> <span id="unlockText">Unlock Content</span>
        </button>
    </div>

    <script>
        const totalTasks = ${totalTasks};
        const unlockTargetUrl = "${unlockUrl}";
        const isClientJust = ${isClientLinkJust};
        
        let completedCount = 0;
        const taskStates = {}; 

        function startTaskVerification(index) {
            if (taskStates[index] && taskStates[index].done) return;

            const taskBtn = document.getElementById('task-btn-' + index);
            const statusText = document.getElementById('status-' + index);
            
            taskStates[index] = {
                clickTime: Date.now(),
                blurTime: null,
                focusTime: null,
                timer: null,
                done: false
            };

            taskBtn.classList.add('verifying');
            statusText.className = "task-status-text info";
            statusText.innerText = "جاري التحقق من إتمام المهمة... (يرجى الانتظار)";

            const onBlur = () => {
                if (taskStates[index] && !taskStates[index].done) {
                    taskStates[index].blurTime = Date.now();
                }
            };

            const onFocus = () => {
                window.removeEventListener('blur', onBlur);
                window.removeEventListener('focus', onFocus);

                if (!taskStates[index] || taskStates[index].done) return;

                const state = taskStates[index];
                state.focusTime = Date.now();

                const awayDuration = (state.focusTime - (state.blurTime || state.clickTime)) / 1000;

                if (awayDuration >= 5) {
                    // النجاح في المهمة
                    state.done = true;
                    completedCount++;
                    
                    taskBtn.className = "task-btn completed";
                    document.getElementById('check-' + index).style.display = 'inline-block';
                    document.getElementById('link-' + index).style.display = 'none';
                    statusText.style.display = 'none';

                    checkTasksCompletion();
                } else {
                    // الفشل وتكرار الإجراء
                    taskBtn.classList.remove('verifying');
                    statusText.className = "task-status-text error";
                    statusText.innerText = "فشلت المهمة! يجب البقاء 5 ثوانٍ على الأقل في الصفحة المطلوبة.";
                }
            };

            window.addEventListener('blur', onBlur);
            window.addEventListener('focus', onFocus);
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

        async function handleUnlockClick() {
            const btn = document.getElementById('unlockBtn');
            if (btn.classList.contains('disabled')) {
                alert('الرجاء إتمام كافة المهام أولاً لفتح الرابط!');
                return;
            }

            if (isClientJust) {
                btn.classList.add('disabled');
                document.getElementById('unlockText').innerText = 'Generating Short Link...';
                document.getElementById('unlockIcon').className = 'fa-solid fa-spinner fa-spin';

                const apiUrl = "https://linkjust.com/api?api=${LINKJUST_API_TOKEN}&url=" + encodeURIComponent(unlockTargetUrl);
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
            }

            window.location.href = unlockTargetUrl;
        }

        if (totalTasks === 0) {
            checkTasksCompletion();
        }
    </script>
</body>
</html>
    `;
};

export default async function handler(req, res) {
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

    if (req.method === "GET") {
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
