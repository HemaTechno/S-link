import db from "./firebase.js";
import { nanoid } from "nanoid";
import axios from "axios";

const LINKJUST_API = "944c5ea148b949eb99be07963d8615e6904f460b";

const cache = new Map();
const spamCache = new Map();

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 5;

// 🛡️ واجهة الخطأ إذا كان الـ VPN مفعلاً
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

// UI Generation مع زر LinkJust
const generatePageHtml = (title, linkName, messageTitle, req, linkjustUrl) => {
    let actionHtml = '';

    if (linkjustUrl) {
        // ✅ إضافة JavaScript للتوجيه التلقائي عند الضغط على الزر
        actionHtml = `
        <a href="${linkjustUrl}" class="network-btn linkjust-btn" id="unlockBtn">
            <span class="btn-text"><i class="fa-solid fa-arrow-up-right-from-square"></i> Click to Unlock</span>
            <img src="/linkjust.png" alt="LinkJust Logo" class="network-logo">
        </a>
        <script>
            // 🚀 توجيه تلقائي بعد 2 ثانية
            setTimeout(function() {
                window.location.href = "${linkjustUrl}";
            }, 1500);
        </script>`;
    } else {
        actionHtml = `
        <div style="color: #ff6b6b; padding: 20px; border: 1px solid #ff6b6b; border-radius: 16px; background: rgba(255, 107, 107, 0.1);">
            <i class="fa-solid fa-triangle-exclamation" style="font-size: 24px;"></i>
            <p style="margin-top: 10px;">Failed to generate LinkJust URL. Please try again later.</p>
        </div>`;
    }

    return `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --primary: #ff6b6b; --bg-dark: #0c0d10; --glass-bg: rgba(20, 21, 25, 0.6); --text-main: #ffffff; }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
        body { background-color: var(--bg-dark); display: flex; justify-content: center; align-items: center; min-height: 100vh; color: var(--text-main); padding: 20px; }
        
        .container { 
            width: 480px; max-width: 100%; padding: 40px 35px; border-radius: 28px; 
            background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); 
            border: 1px solid rgba(255, 255, 255, 0.08); text-align: center; 
            box-shadow: 0 25px 50px rgba(0,0,0,0.5); 
        }
        
        .logo-container img { max-width: 180px; margin-bottom: 25px; }
        h1 { color: var(--primary); margin-bottom: 15px; font-size: 1.8rem; }
        .desc { color: #a0a0a0; margin-bottom: 30px; font-size: 1.1rem; }
        
        .network-btn {
            position: relative;
            width: 100%;
            padding: 20px 24px;
            border-radius: 16px;
            cursor: pointer;
            text-decoration: none;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid rgba(255, 107, 107, 0.15);
            background: linear-gradient(135deg, rgba(255, 107, 107, 0.05), rgba(255, 107, 107, 0.02));
            overflow: hidden;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(255, 107, 107, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0); }
        }

        .btn-text { 
            font-size: 18px; 
            font-weight: 800; 
            z-index: 2; 
            display: flex;
            align-items: center;
            gap: 12px;
            color: #ff6b6b;
        }
        
        .network-logo { height: 28px; object-fit: contain; z-index: 2; max-width: 120px; }

        .linkjust-btn:hover {
            transform: translateY(-4px) scale(1.02);
            border-color: rgba(255, 107, 107, 0.5);
            box-shadow: 0 8px 30px rgba(255, 107, 107, 0.25);
            background: rgba(255, 107, 107, 0.1);
        }

        .loading-spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255, 107, 107, 0.3);
            border-radius: 50%;
            border-top-color: #ff6b6b;
            animation: spin 1s ease-in-out infinite;
            margin-right: 10px;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-container"><img src="/logo.png" alt="Logo"></div>
        <h1><i class="fa-solid fa-shield-halved"></i> ${messageTitle}</h1>
        <div class="desc">Content ID: <strong>${linkName}</strong></div>
        ${actionHtml}
    </div>
</body>
</html>
    `;
};

export default async function handler(req, res) {
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

            const { url, slug } = req.body;
            if (!url) return res.status(400).json({ success: false, message: "URL required" });

            let id = (slug && slug.trim() !== "") ? slug.trim().toLowerCase() : nanoid(6);
            const exists = await db.collection("links").doc(id).get();
            if (exists.exists) return res.status(400).json({ success: false, message: "Alias in use" });

            await db.collection("links").doc(id).set({
                url, 
                createdAt: Date.now()
            });

            return res.status(200).json({ success: true, short: `${req.headers.origin}/${id}` });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }

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

            let linkjustUrl = null;

            // ✅ استخدام LinkJust مع Alias
            try {
                const finalDestinationUrl = data.url;
                const alias = `subx_${id}`; // استخدم Alias ثابت عشان التتبع
                
                // الرابط زي ما أنت عاوز بالضبط
                const linkjustApiUrl = `https://linkjust.com/api?api=${LINKJUST_API}&url=${encodeURIComponent(finalDestinationUrl)}&alias=${alias}`;
                console.log("📤 Sending request to:", linkjustApiUrl);
                
                const response = await axios.get(linkjustApiUrl, { 
                    timeout: 15000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                console.log("📥 Response status:", response.status);
                console.log("📥 Response data:", response.data);

                // معالجة الاستجابة
                if (response.data && response.data.status === 'success' && response.data.shortenedUrl) {
                    linkjustUrl = response.data.shortenedUrl;
                } else if (typeof response.data === 'string' && response.data.trim().startsWith('https://linkjust.com/')) {
                    linkjustUrl = response.data.trim();
                } else {
                    console.log("❌ Unexpected response format:", response.data);
                }
                
                if (linkjustUrl) {
                    console.log(`✅ LinkJust created: ${linkjustUrl}`);
                } else {
                    console.log("❌ Failed to get LinkJust URL");
                }
                
            } catch (err) {
                console.error("❌ LinkJust API Error:", err.message);
                if (err.response) {
                    console.error("Response status:", err.response.status);
                    console.error("Response data:", err.response.data);
                }
            }

            res.setHeader("Content-Type", "text/html; charset=utf-8");
            return res.status(200).send(generatePageHtml("LinkJust Unlock", id, "Complete Task to Unlock", req, linkjustUrl));

        } catch (err) {
            console.error("Error Details:", err.message);
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            return res.status(500).send("Internal Server Error");
        }
    }

    return res.status(405).send("Method Not Allowed");
}
