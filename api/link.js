import db from "./firebase.js";
import { nanoid } from "nanoid";
// لم نعد بحاجة ماسة لـ axios مع Linkvertise لأننا سنستخدم الـ Dynamic Links، ولكن تم الإبقاء عليه تحسباً لاحتياجاتك.
import axios from "axios"; 

// قم بتغيير هذا الرقم إلى الـ User ID الخاص بك في Linkvertise
const LINKVERTISE_USER_ID = "1322389"; 

const cache = new Map();
const spamCache = new Map(); 

const RATE_LIMIT_WINDOW = 60 * 1000; 
const MAX_REQUESTS = 5;

// Glassmorphism UI Generation with Open Graph (Dynamic Domain)
const generatePageHtml = (title, linkName, content, messageTitle, req) => {
    const isUrl = content.trim().startsWith("http://") || content.trim().startsWith("https://");

    // استخراج الدومين تلقائياً لصور Open Graph
    const host = req.headers.host || "";
    const protocol = host.includes("localhost") ? "http" : "https";
    const fullImageUrl = host ? `${protocol}://${host}/logo.png` : "/logo.png";
    const pageUrl = host ? `${protocol}://${host}/?id=${linkName}` : "";

    let actionHtml = '';
    if (isUrl) {
        actionHtml = `
        <a href="${content}" class="btn">
            Click here to continue <i class="fa-solid fa-arrow-right"></i>
        </a>`;
    } else {
        actionHtml = `
        <div class="text-container">
            <textarea id="textContent" readonly rows="4">${content}</textarea>
        </div>
        <button class="btn copy-btn" onclick="copyText()">
            Copy Text <i class="fa-solid fa-copy"></i>
        </button>
        <script>
            function copyText() {
                const text = document.getElementById("textContent");
                text.select();
                navigator.clipboard.writeText(text.value);
                const btn = document.querySelector(".copy-btn");
                btn.innerHTML = 'Copied! <i class="fa-solid fa-check"></i>';
                setTimeout(() => {
                    btn.innerHTML = 'Copy Text <i class="fa-solid fa-copy"></i>';
                }, 2000);
            }
        </script>`;
    }

    return `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<script src="https://beansnicerroller.com/1c/8c/07/1c8c07e41dacee6cc4a64a6f22c04a4b.js"></script>

<script>(function(s){s.dataset.zone='11383401',s.src='https://al5sm.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Primary Meta Tags -->
    <title>${title}</title>
    <meta name="title" content="Unlock: ${linkName}">
    <meta name="description" content="Get secure access to this exclusive content, script, or file via our smart locker.">
    <meta name="theme-color" content="#ffd700">

    <!-- Open Graph / Facebook / Discord -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:title" content="Unlock: ${linkName}">
    <meta property="og:description" content="Get secure access to this exclusive content, script, or file via our smart locker.">
    <meta property="og:image" content="${fullImageUrl}">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${pageUrl}">
    <meta property="twitter:title" content="Unlock: ${linkName}">
    <meta property="twitter:description" content="Get secure access to this exclusive content, script, or file via our smart locker.">
    <meta property="twitter:image" content="${fullImageUrl}">

    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
        :root {
            --primary: #ffd700;
            --primary-hover: #ffea00;
            --bg-dark: #0c0d10;
            --glass-bg: rgba(20, 21, 25, 0.6);
            --glass-border: rgba(255, 255, 255, 0.08);
            --text-main: #ffffff;
            --text-muted: #a0a0a0;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
        body {
            background-color: var(--bg-dark);
            background-image: radial-gradient(at 10% 10%, rgba(255, 215, 0, 0.05) 0px, transparent 50%),
                              radial-gradient(at 90% 90%, rgba(255, 215, 0, 0.05) 0px, transparent 50%);
            display: flex; justify-content: center; align-items: center; min-height: 100vh; color: var(--text-main); padding: 20px;
        }
        .container {
            width: 480px; max-width: 100%; padding: 40px 35px; border-radius: 28px;
            background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border); text-align: center;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.05);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .container:hover { transform: translateY(-3px); box-shadow: 0 30px 60px rgba(255, 215, 0, 0.05); }
        .logo-container { text-align: center; margin-bottom: 25px; }
        .logo-container img { max-width: 180px; height: auto; display: inline-block; }
        h1 { color: var(--primary); margin-bottom: 15px; font-size: 1.8rem; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 10px; text-shadow: 0px 2px 10px rgba(255, 215, 0, 0.2); }
        .desc { color: var(--text-muted); margin-bottom: 30px; font-size: 1.1rem; line-height: 1.6; word-break: break-all; }
        .warning-box {
            background: rgba(255, 80, 80, 0.05); border: 1px solid rgba(248, 113, 113, 0.3);
            color: #f87171; padding: 18px; border-radius: 16px; margin-bottom: 25px; font-weight: 600; font-size: 15px; line-height: 1.6;
        }
        .text-container {
            background: rgba(0, 0, 0, 0.3); border: 1px solid var(--glass-border);
            border-radius: 16px; padding: 15px; margin-bottom: 20px; text-align: left;
        }
        textarea {
            width: 100%; background: transparent; border: none; color: var(--text-main);
            font-size: 16px; resize: none; outline: none; font-family: inherit; line-height: 1.5;
        }
        .btn {
            width: 100%; padding: 16px; background: linear-gradient(135deg, var(--primary) 0%, #b89b00 100%);
            color: #000; border: none; border-radius: 16px; cursor: pointer; font-size: 18px; font-weight: 800;
            text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 10px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 6px 20px rgba(255, 215, 0, 0.15);
        }
        .btn:hover {
            transform: translateY(-2px); box-shadow: 0 10px 25px rgba(255, 215, 0, 0.25);
            background: linear-gradient(135deg, var(--primary-hover) 0%, #c9a900 100%);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-container">
            <img src="/logo.png" alt="Logo">
        </div>
        <h1><i class="fa-solid fa-shield-halved"></i> ${messageTitle}</h1>
        <div class="desc">Content ID: <strong>${linkName}</strong></div>
        
        <div class="warning-box">
            <i class="fa-solid fa-triangle-exclamation"></i> 
            <strong>Attention:</strong> The next page contains pop-up ads. Please close them when they appear.
        </div>

        ${actionHtml}
    </div>
</body>
</html>
    `;
};

export default async function handler(req, res) {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress || "unknown";

    if (req.method === "POST") {
        try {
            const currentTime = Date.now();
            const userSpamData = spamCache.get(ip) || { count: 0, startTime: currentTime };

            if (currentTime - userSpamData.startTime > RATE_LIMIT_WINDOW) {
                userSpamData.count = 1;
                userSpamData.startTime = currentTime;
            } else {
                userSpamData.count++;
            }
            spamCache.set(ip, userSpamData);

            if (userSpamData.count > MAX_REQUESTS) {
                return res.status(429).json({
                    success: false,
                    message: "Too many requests! Please wait a minute before creating new links."
                });
            }

            const { url, slug, tier, tasks } = req.body;

            if (!url) {
                return res.status(400).json({ success: false, message: "URL or Text content is required" });
            }

            let id;
            if (slug && slug.trim() !== "") {
                id = slug.trim().toLowerCase();
                if (!/^[a-zA-Z0-9_-]{3,30}$/.test(id)) {
                    return res.status(400).json({ success: false, message: "Invalid custom alias" });
                }
            } else {
                id = nanoid(6);
            }

            const exists = await db.collection("links").doc(id).get();
            if (exists.exists) {
                return res.status(400).json({ success: false, message: "Alias is already in use" });
            }

            await db.collection("links").doc(id).set({
                url, 
                completedTasksCount: 0, 
                createdAt: Date.now(),
                tier: tier ? parseInt(tier) : 1,       
                tasks: tasks ? parseInt(tasks) : 3      
            });

            return res.status(200).json({
                success: true,
                short: `${req.headers.origin}/${id}`
            });

        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    if (req.method === "PUT") {
        try {
            const { id, url } = req.body;
            if (!id || !url) return res.status(400).json({ success: false, message: "ID and content are required" });
            const docRef = db.collection("links").doc(id);
            const doc = await docRef.get();
            if (!doc.exists) return res.status(404).json({ success: false, message: "Content not found in database" });
            await docRef.update({ url: url });
            cache.delete(id);
            return res.status(200).json({ success: true, message: "Updated successfully" });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    if (req.method === "DELETE") {
        try {
            const { id } = req.body;
            if (!id) return res.status(400).json({ success: false, message: "ID is required for deletion" });
            const docRef = db.collection("links").doc(id);
            const doc = await docRef.get();
            if (!doc.exists) return res.status(404).json({ success: false, message: "Content to be deleted not found" });
            await docRef.delete();
            cache.delete(id);
            return res.status(200).json({ success: true, message: "Deleted successfully" });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    if (req.method === "GET") {
        const id = req.query.id;
        let originalUrl = "";

        try {
            if (!id) return res.status(404).send("Not Found");

            const doc = await db.collection("links").doc(id).get();
            if (!doc.exists) return res.status(404).send("Content not found");

            const data = doc.data();
            originalUrl = data.url;

            const cached = cache.get(id);
            
            res.setHeader("Content-Type", "text/html; charset=utf-8");

            if (cached && cached.expire > Date.now() && cached.url) {
                return res.status(200).send(generatePageHtml("Redirecting...", id, cached.url, "Redirecting to Verification", req));
            }

            // إنشاء رابط الإكمال الخاص بموقعك (الذي سيعود إليه المستخدم بعد إنهاء تخطي Linkvertise)
            const completionUrl = `https://subx.click/api/complete?id=${id}&tc=[tc]`;

            // تشفير الرابط بصيغة Base64 حسب متطلبات نظام Linkvertise
            const base64Url = Buffer.from(completionUrl).toString('base64');
            
            // دمج الرابط مع رقم حسابك في Linkvertise. يتم إضافة Math.random لمنع تخزين الرابط في الـ Cache الخاص بالمتصفحات
            const randomString = Math.random().toString(36).substring(7);
            const linkvertiseUrl = `https://link-to.net/${LINKVERTISE_USER_ID}/${randomString}/dynamic?r=${base64Url}`;

            if (linkvertiseUrl) {
                cache.set(id, {
                    url: linkvertiseUrl,
                    expire: Date.now() + 60000 // مدة الكاش
                });
                
                return res.status(200).send(generatePageHtml("Redirecting...", id, linkvertiseUrl, "Redirecting to Verification", req));
            }

        } catch (err) {
            console.error("Link Generation Error Details:", err.message);
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            
            if (originalUrl) {
                // العودة للرابط الأصلي في حال حدوث خطأ
                return res.status(200).send(generatePageHtml("Redirecting...", id, originalUrl, "Direct Access", req));
            }

            return res.status(500).json({
                success: false,
                message: "Linkvertise Generation Error",
                error: err.message
            });
        }
    }

    return res.status(405).send("Method Not Allowed");
}
