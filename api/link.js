import db from "./firebase.js";
import { nanoid } from "nanoid";
import axios from "axios";

const LOOTLABS_API = "d2cc58f8084e256f9a15e41ab3971855c0289ed29a00dbf681e31b8b237ace81";
const LINKVERTISE_USER_ID = "123456"; // ضع الـ ID الخاص بك هنا

const cache = new Map();
const spamCache = new Map(); 

const RATE_LIMIT_WINDOW = 60 * 1000; 
const MAX_REQUESTS = 5;

// Glassmorphism UI Generation with Custom Network Buttons
const generatePageHtml = (title, linkName, messageTitle, req, urls) => {
    const host = req.headers.host || "";
    const protocol = host.includes("localhost") ? "http" : "https";
    const fullImageUrl = host ? `${protocol}://${host}/logo.png` : "/logo.png";
    const pageUrl = host ? `${protocol}://${host}/?id=${linkName}` : "";

    let actionHtml = '';

    // HTML & CSS الخاص بالأزرار الجديدة
    const getNetworkButtons = (lootlabsUrl, linkvertiseUrl) => {
        let buttons = '';
        
        if (lootlabsUrl) {
            buttons += `
            <a href="${lootlabsUrl}" class="network-btn lootlabs-btn">
                <span class="btn-text">Unlock via LootLabs</span>
                <img src="/LootLabs.png" alt="LootLabs Logo" class="network-logo">
            </a>`;
        }

        if (lootlabsUrl && linkvertiseUrl) {
            buttons += `<div class="or-divider"><span>OR</span></div>`;
        }

        if (linkvertiseUrl) {
            buttons += `
            <a href="${linkvertiseUrl}" class="network-btn linkvertise-btn">
                <span class="btn-text">Unlock via Linkvertise</span>
                <img src="/linkvertise.png" alt="Linkvertise Logo" class="network-logo link-logo">
            </a>`;
        }
        
        return `<div class="networks-container">${buttons}</div>`;
    };

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
    else if (urls.lootlabs || urls.linkvertise) {
        actionHtml = getNetworkButtons(urls.lootlabs, urls.linkvertise);
    } 
    else if (urls.direct) {
        actionHtml = `
        <a href="${urls.direct}" class="btn default-btn">
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
        
        /* New Button Styles */
        .networks-container { display: flex; flex-direction: column; gap: 15px; }
        
        .network-btn {
            position: relative;
            width: 100%;
            padding: 20px;
            border-radius: 18px;
            cursor: pointer;
            text-decoration: none;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 12px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 2px solid transparent;
            overflow: hidden;
        }

        .btn-text { font-size: 17px; font-weight: 800; z-index: 2; }
        
        .network-logo { height: 28px; object-fit: contain; z-index: 2; }
        .link-logo { height: 22px; } /* Linkvertise logo needs specific sizing */

        /* LootLabs Button Styling */
        .lootlabs-btn {
            background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%);
            border-color: rgba(255, 215, 0, 0.3);
            color: #ffd700;
            box-shadow: 0 8px 25px rgba(255, 215, 0, 0.1);
        }
        .lootlabs-btn:hover {
            transform: translateY(-3px);
            border-color: #ffd700;
            box-shadow: 0 12px 30px rgba(255, 215, 0, 0.25);
            background: linear-gradient(135deg, #2a2a2a 0%, #111 100%);
        }

        /* Linkvertise Button Styling */
        .linkvertise-btn {
            background: linear-gradient(135deg, #00b09b 0%, #96c93d 100%);
            color: #ffffff;
            box-shadow: 0 8px 25px rgba(0, 176, 155, 0.2);
        }
        .linkvertise-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 30px rgba(0, 176, 155, 0.4);
            background: linear-gradient(135deg, #00c9b1 0%, #a3d944 100%);
        }

        /* OR Divider */
        .or-divider { text-align: center; margin: 10px 0; position: relative; }
        .or-divider::before { content: ''; position: absolute; top: 50%; left: 0; width: 100%; height: 1px; background: rgba(255, 255, 255, 0.1); z-index: 1; }
        .or-divider span { background: var(--bg-dark); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 800; color: #a0a0a0; position: relative; z-index: 2; border: 1px solid rgba(255, 255, 255, 0.1); }

        .default-btn { width: 100%; padding: 16px; border-radius: 16px; cursor: pointer; font-size: 18px; font-weight: 800; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 10px; color: #000; background: var(--primary); border: none; transition: transform 0.3s; }
        .default-btn:hover { transform: translateY(-2px); }
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
    if (req.method === "PATCH") {
        try {
            const { lootlabsEnabled, linkvertiseEnabled, adminKey } = req.body;
            if (adminKey !== "MY_SECRET_ADMIN_PASSWORD") return res.status(401).json({ success: false, message: "Unauthorized" });

            const settings = { lootlabs: Boolean(lootlabsEnabled), linkvertise: Boolean(linkvertiseEnabled) };
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

            const { url, slug, tier, tasks } = req.body;
            if (!url) return res.status(400).json({ success: false, message: "URL required" });

            let id = (slug && slug.trim() !== "") ? slug.trim().toLowerCase() : nanoid(6);
            const exists = await db.collection("links").doc(id).get();
            if (exists.exists) return res.status(400).json({ success: false, message: "Alias in use" });

            await db.collection("links").doc(id).set({
                url, 
                completedTasksCount: 0, 
                lootlabsCompletions: 0, // عداد مخصص للوت لابز
                linkvertiseCompletions: 0, // عداد مخصص للينك فيرتيس
                createdAt: Date.now(),
                tier: tier ? parseInt(tier) : 1,       
                tasks: tasks ? parseInt(tasks) : 3      
            });

            return res.status(200).json({ success: true, short: `${req.headers.origin}/${id}` });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    if (req.method === "GET") {
        const id = req.query.id;
        try {
            if (!id) return res.status(404).send("Not Found");

            const doc = await db.collection("links").doc(id).get();
            if (!doc.exists) return res.status(404).send("Content not found");
            const data = doc.data();
            const originalContent = data.url;
            const isUrl = originalContent.trim().startsWith("http");

            if (!isUrl) return res.status(200).send(generatePageHtml("Unlock Content", id, "Direct Access", req, { text: originalContent }));

            let adSettings = cache.get("adSettings");
            if (!adSettings) {
                const settingsDoc = await db.collection("settings").doc("adNetworks").get();
                adSettings = settingsDoc.exists ? settingsDoc.data() : { lootlabs: true, linkvertise: true }; 
                cache.set("adSettings", adSettings);
            }

            let urls = { lootlabs: null, linkvertise: null, direct: originalContent };
            
            // إضافة &network=linkvertise إلى رابط العودة لتسجيل المصدر
            const linkvertiseCompletionUrl = `https://subx.click/api/complete?id=${id}&network=linkvertise&tc=[tc]`;
            // إضافة &network=lootlabs إلى رابط العودة لتسجيل المصدر
            const lootlabsCompletionUrl = `https://subx.click/api/complete?id=${id}&network=lootlabs&tc=[tc]`;

            if (adSettings.linkvertise) {
                const base64Url = Buffer.from(linkvertiseCompletionUrl).toString('base64');
                const randomString = Math.random().toString(36).substring(7);
                urls.linkvertise = `https://link-to.net/${LINKVERTISE_USER_ID}/${randomString}/dynamic?r=${base64Url}`;
            }

            if (adSettings.lootlabs) {
                try {
                    const response = await axios.post(
                        "https://creators.lootlabs.gg/api/public/content_locker",
                        { title: id, url: lootlabsCompletionUrl, tier_id: data.tier || 1, number_of_tasks: data.tasks || 3, theme: 1 },
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
