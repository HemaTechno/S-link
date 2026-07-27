import db from "./firebase.js";
import { nanoid } from "nanoid";
import axios from "axios";

const LOOTLABS_API = "d2cc58f8084e256f9a15e41ab3971855c0289ed29a00dbf681e31b8b237ace81";
const LINKVERTISE_USER_ID = "1322389"; // ضع الـ ID الخاص بك هنا

const cache = new Map();
const spamCache = new Map(); 

const RATE_LIMIT_WINDOW = 60 * 1000; 
const MAX_REQUESTS = 5;

// Glassmorphism UI Generation
const generatePageHtml = (title, linkName, messageTitle, req, urls) => {
    const host = req.headers.host || "";
    const protocol = host.includes("localhost") ? "http" : "https";
    const fullImageUrl = host ? `${protocol}://${host}/logo.png` : "/logo.png";
    const pageUrl = host ? `${protocol}://${host}/?id=${linkName}` : "";

    let actionHtml = '';

    // إذا كان هناك محتوى نصي مباشر (لا يوجد إعلانات)
    if (urls.text) {
        actionHtml = `
        <div class="text-container">
            <textarea id="textContent" readonly rows="4">${urls.text}</textarea>
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
                setTimeout(() => { btn.innerHTML = 'Copy Text <i class="fa-solid fa-copy"></i>'; }, 2000);
            }
        </script>`;
    } 
    // إذا كان النظامين مفعلين
    else if (urls.lootlabs && urls.linkvertise) {
        actionHtml = `
        <div style="display: flex; flex-direction: column; gap: 15px;">
            <a href="${urls.lootlabs}" class="btn" style="background: linear-gradient(135deg, #ffd700 0%, #b89b00 100%);">
                Unlock via LootLabs <i class="fa-solid fa-gem"></i>
            </a>
            <a href="${urls.linkvertise}" class="btn" style="background: linear-gradient(135deg, #00b09b 0%, #96c93d 100%); color: #fff;">
                Unlock via Linkvertise <i class="fa-solid fa-link"></i>
            </a>
        </div>`;
    } 
    // إذا كان LootLabs فقط مفعل
    else if (urls.lootlabs) {
        actionHtml = `
        <a href="${urls.lootlabs}" class="btn">
            Unlock via LootLabs <i class="fa-solid fa-arrow-right"></i>
        </a>`;
    } 
    // إذا كان Linkvertise فقط مفعل
    else if (urls.linkvertise) {
        actionHtml = `
        <a href="${urls.linkvertise}" class="btn" style="background: linear-gradient(135deg, #00b09b 0%, #96c93d 100%); color: #fff;">
            Unlock via Linkvertise <i class="fa-solid fa-arrow-right"></i>
        </a>`;
    } 
    // إذا تم تعطيل كلاهما (توجيه مباشر)
    else if (urls.direct) {
        actionHtml = `
        <a href="${urls.direct}" class="btn">
            Direct Access (No Ads) <i class="fa-solid fa-arrow-right"></i>
        </a>`;
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
        :root { --primary: #ffd700; --bg-dark: #0c0d10; --glass-bg: rgba(20, 21, 25, 0.6); --text-main: #ffffff; }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
        body { background-color: var(--bg-dark); display: flex; justify-content: center; align-items: center; min-height: 100vh; color: var(--text-main); padding: 20px; }
        .container { width: 480px; max-width: 100%; padding: 40px 35px; border-radius: 28px; background: var(--glass-bg); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.08); text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.5); }
        .logo-container img { max-width: 180px; margin-bottom: 25px; }
        h1 { color: var(--primary); margin-bottom: 15px; font-size: 1.8rem; }
        .desc { color: #a0a0a0; margin-bottom: 30px; font-size: 1.1rem; }
        .btn { width: 100%; padding: 16px; border-radius: 16px; cursor: pointer; font-size: 18px; font-weight: 800; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 10px; color: #000; border: none; transition: transform 0.3s; }
        .btn:hover { transform: translateY(-2px); }
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
    // 1. نظام جلب الإعدادات والتحكم بالشبكات (Settings Toggle)
    if (req.method === "PATCH") {
        try {
            const { lootlabsEnabled, linkvertiseEnabled, adminKey } = req.body;
            
            // حماية التعديل (قم بتغيير كلمة المرور هذه)
            if (adminKey !== "MY_SECRET_ADMIN_PASSWORD") {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            const settings = {
                lootlabs: Boolean(lootlabsEnabled),
                linkvertise: Boolean(linkvertiseEnabled)
            };

            await db.collection("settings").doc("adNetworks").set(settings);
            cache.set("adSettings", settings); // تحديث الكاش فوراً

            return res.status(200).json({ success: true, message: "Settings updated successfully", settings });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    // 2. الكود القديم لإنشاء الروابط (POST)
    if (req.method === "POST") {
        // [نفس الكود الخاص بك في الرد السابق بدون تغيير]
        // ... (تخطينا كتابته هنا للاختصار، انسخ كود الـ POST من الكود السابق)
    }

    // 3. كود عرض الصفحة للمستخدم النهائي (GET)
    if (req.method === "GET") {
        const id = req.query.id;
        try {
            if (!id) return res.status(404).send("Not Found");

            const doc = await db.collection("links").doc(id).get();
            if (!doc.exists) return res.status(404).send("Content not found");
            const data = doc.data();
            const originalContent = data.url;
            const isUrl = originalContent.trim().startsWith("http");

            if (!isUrl) {
                return res.status(200).send(generatePageHtml("Unlock Content", id, "Direct Access", req, { text: originalContent }));
            }

            // جلب الإعدادات من الكاش، وإذا لم تكن موجودة نجلبها من Firebase
            let adSettings = cache.get("adSettings");
            if (!adSettings) {
                const settingsDoc = await db.collection("settings").doc("adNetworks").get();
                adSettings = settingsDoc.exists ? settingsDoc.data() : { lootlabs: true, linkvertise: true }; // الافتراضي كلاهما يعمل
                cache.set("adSettings", adSettings);
            }

            let urls = { lootlabs: null, linkvertise: null, direct: originalContent };
            const completionUrl = `https://subx.click/api/complete?id=${id}&tc=[tc]`;

            // هل Linkvertise مفعل؟
            if (adSettings.linkvertise) {
                const base64Url = Buffer.from(completionUrl).toString('base64');
                const randomString = Math.random().toString(36).substring(7);
                urls.linkvertise = `https://link-to.net/${LINKVERTISE_USER_ID}/${randomString}/dynamic?r=${base64Url}`;
            }

            // هل LootLabs مفعل؟
            if (adSettings.lootlabs) {
                try {
                    const response = await axios.post(
                        "https://creators.lootlabs.gg/api/public/content_locker",
                        { title: id, url: completionUrl, tier_id: data.tier || 1, number_of_tasks: data.tasks || 3, theme: 1 },
                        { headers: { Authorization: `Bearer ${LOOTLABS_API}`, "Content-Type": "application/json" } }
                    );
                    const messageData = Array.isArray(response.data?.message) ? response.data.message[0] : response.data?.message;
                    urls.lootlabs = messageData?.loot_url || response.data?.loot_url;
                } catch (err) {
                    console.error("LootLabs API Error", err.message);
                }
            }

            res.setHeader("Content-Type", "text/html; charset=utf-8");
            return res.status(200).send(generatePageHtml("Choose Verification", id, "Select a Method to Unlock", req, urls));

        } catch (err) {
            console.error("Error Details:", err.message);
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            return res.status(500).send("Internal Server Error");
        }
    }

    return res.status(405).send("Method Not Allowed");
}
