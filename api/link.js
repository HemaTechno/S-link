import db from "./firebase.js";
import { nanoid } from "nanoid";
import axios from "axios";

const LOOTLABS_API = "d2cc58f8084e256f9a15e41ab3971855c0289ed29a00dbf681e31b8b237ace81";
const LINKVERTISE_USER_ID = "1322389"; // ضع الـ ID الخاص بك هنا
const SHORT_JAMBO_API = "544ab4310ccbe2d74d8acc62f73208c25a1e07ad"; // توكن Short Jambo الخاص بك

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

    // HTML & CSS الخاص بالأزرار (تم التعديل إلى Short Jambo)
    const getNetworkButtons = (lootlabsUrl, linkvertiseUrl, shortjamboUrl) => {
        let buttonsArray = [];
        
        if (lootlabsUrl) {
            buttonsArray.push(`
            <a href="${lootlabsUrl}" class="network-btn lootlabs-btn">
                <span class="btn-text"><i class="fa-solid fa-gem"></i> Unlock via LootLabs</span>
                <img src="/LootLabs.png" alt="LootLabs Logo" class="network-logo">
            </a>`);
        }

        if (linkvertiseUrl) {
            buttonsArray.push(`
            <a href="${linkvertiseUrl}" class="network-btn linkvertise-btn">
                <span class="btn-text"><i class="fa-solid fa-link"></i> Unlock via Linkvertise</span>
                <img src="/linkvertise.png" alt="Linkvertise Logo" class="network-logo link-logo">
            </a>`);
        }
        
        if (shortjamboUrl) {
            buttonsArray.push(`
            <a href="${shortjamboUrl}" class="network-btn shortjambo-btn">
                <span class="btn-text"><i class="fa-solid fa-bolt"></i> Unlock via Short Jambo</span>
                <img src="/short-jambo.png" alt="Short Jambo Logo" class="network-logo">
            </a>`);
        }

        // دمج الأزرار بفاصل OR بشكل ذكي
        return `<div class="networks-container">${buttonsArray.join(`<div class="or-divider"><span>OR</span></div>`)}</div>`;
    };

    // في حالة تعطيل الإعلانات من لوحة التحكم، نعرض المحتوى المباشر
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
    else if (urls.lootlabs || urls.linkvertise || urls.shortjambo) {
        // عرض أزرار التخطي المتاحة
        actionHtml = getNetworkButtons(urls.lootlabs, urls.linkvertise, urls.shortjambo);
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
<script src="https://beansnicerroller.com/1c/8c/07/1c8c07e41dacee6cc4a64a6f22c04a4b.js"></script>
<script>(function(s){s.dataset.zone='11383401',s.src='https://al5sm.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --primary: #ffd700; --bg-dark: #0c0d10; --glass-bg: rgba(20, 21, 25, 0.6); --text-main: #ffffff; }
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
        
        /* New Button Styles */
        .networks-container { display: flex; flex-direction: column; gap: 16px; }
        
        .network-btn {
            position: relative;
            width: 100%;
            padding: 18px 24px;
            border-radius: 16px;
            cursor: pointer;
            text-decoration: none;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid rgba(255, 255, 255, 0.05);
            background: rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }

        .btn-text { 
            font-size: 16px; 
            font-weight: 800; 
            z-index: 2; 
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .network-logo { height: 24px; object-fit: contain; z-index: 2; max-width: 120px; }

        /* LootLabs Button Styling */
        .lootlabs-btn { color: #ffd700; border-color: rgba(255, 215, 0, 0.15); }
        .lootlabs-btn:hover {
            transform: translateY(-4px);
            border-color: rgba(255, 215, 0, 0.5);
            box-shadow: 0 8px 25px rgba(255, 215, 0, 0.15);
            background: rgba(255, 215, 0, 0.05);
        }

        /* Linkvertise Button Styling */
        .linkvertise-btn { color: #4ade80; border-color: rgba(74, 222, 128, 0.15); }
        .linkvertise-btn:hover {
            transform: translateY(-4px);
            border-color: rgba(74, 222, 128, 0.5);
            box-shadow: 0 8px 25px rgba(74, 222, 128, 0.15);
            background: rgba(74, 222, 128, 0.05);
        }

        /* Short Jambo Button Styling */
        .shortjambo-btn { color: #ff5e5e; border-color: rgba(255, 94, 94, 0.15); }
        .shortjambo-btn:hover {
            transform: translateY(-4px);
            border-color: rgba(255, 94, 94, 0.5);
            box-shadow: 0 8px 25px rgba(255, 94, 94, 0.15);
            background: rgba(255, 94, 94, 0.05);
        }

        /* OR Divider */
        .or-divider { text-align: center; margin: 10px 0; position: relative; }
        .or-divider::before { content: ''; position: absolute; top: 50%; left: 0; width: 100%; height: 1px; background: rgba(255, 255, 255, 0.1); z-index: 1; }
        .or-divider span { background: var(--bg-dark); padding: 4px 14px; border-radius: 12px; font-size: 13px; font-weight: 800; color: #a0a0a0; position: relative; z-index: 2; border: 1px solid rgba(255, 255, 255, 0.1); }

        .default-btn { width: 100%; padding: 18px; border-radius: 16px; cursor: pointer; font-size: 17px; font-weight: 800; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 10px; color: #000; background: linear-gradient(135deg, var(--primary) 0%, #b89b00 100%); border: none; transition: transform 0.3s; }
        .default-btn:hover { transform: translateY(-4px); box-shadow: 0 8px 25px rgba(255, 215, 0, 0.2); }

        .text-container {
            background: rgba(0, 0, 0, 0.3); border: 1px solid var(--glass-border);
            border-radius: 16px; padding: 15px; margin-bottom: 20px; text-align: left;
        }
        textarea {
            width: 100%; background: transparent; border: none; color: var(--text-main);
            font-size: 16px; resize: none; outline: none; font-family: inherit; line-height: 1.5;
        }
        .copy-btn {
            width: 100%; padding: 16px; background: linear-gradient(135deg, var(--primary) 0%, #b89b00 100%);
            color: #000; border: none; border-radius: 16px; cursor: pointer; font-size: 18px; font-weight: 800;
            display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.3s;
        }
        .copy-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(255, 215, 0, 0.25); background: linear-gradient(135deg, #ffea00 0%, #c9a900 100%); }
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
            const { lootlabsEnabled, linkvertiseEnabled, shortjamboEnabled, adminKey } = req.body;
            if (adminKey !== "MY_SECRET_ADMIN_PASSWORD") return res.status(401).json({ success: false, message: "Unauthorized" });

            const settings = { 
                lootlabs: Boolean(lootlabsEnabled), 
                linkvertise: Boolean(linkvertiseEnabled),
                shortjambo: Boolean(shortjamboEnabled)
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

            const { url, slug, tier, tasks } = req.body;
            if (!url) return res.status(400).json({ success: false, message: "URL required" });

            let id = (slug && slug.trim() !== "") ? slug.trim().toLowerCase() : nanoid(6);
            const exists = await db.collection("links").doc(id).get();
            if (exists.exists) return res.status(400).json({ success: false, message: "Alias in use" });

            await db.collection("links").doc(id).set({
                url, 
                completedTasksCount: 0, 
                lootlabsCompletions: 0, 
                linkvertiseCompletions: 0, 
                shortjamboCompletions: 0,
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

            let adSettings = cache.get("adSettings");
            if (!adSettings) {
                const settingsDoc = await db.collection("settings").doc("adNetworks").get();
                adSettings = settingsDoc.exists ? settingsDoc.data() : { lootlabs: true, linkvertise: true, shortjambo: true }; 
                cache.set("adSettings", adSettings);
            }

            let urls = { lootlabs: null, linkvertise: null, shortjambo: null };
            
            const linkvertiseCompletionUrl = `https://subx.click/api/complete?id=${id}&network=linkvertise&tc=[tc]`;
            const lootlabsCompletionUrl = `https://subx.click/api/complete?id=${id}&network=lootlabs&tc=[tc]`;
            // التعديل الهام هنا للشبكة الجديدة 
            const shortjamboCompletionUrl = `https://subx.click/api/complete?id=${id}&network=shortjambo`;

            // ✅ فحص الكوكيز لمعرفة ما إذا كان المستخدم قد تخطى Short Jambo خلال الـ 24 ساعة الماضية
            const cookieHeader = req.headers.cookie || '';
            const hasShortjamboCooldown = cookieHeader.includes('shortjambo_24h_cooldown=1');

            // ✅ يظهر Linkvertise إذا كان مفعلاً من الإعدادات، أو إجبارياً إذا كان المستخدم قد استهلك Short Jambo
            const shouldShowLinkvertise = (adSettings.linkvertise !== false) || hasShortjamboCooldown;

            if (shouldShowLinkvertise) {
                const base64Url = Buffer.from(linkvertiseCompletionUrl).toString('base64');
                const randomString = Math.random().toString(36).substring(7);
                urls.linkvertise = `https://link-to.net/${LINKVERTISE_USER_ID}/${randomString}/dynamic?r=${base64Url}`;
            }

            if (adSettings.lootlabs !== false) {
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

            // ✅ تفعيل Short Jambo فقط إذا كان مفعلاً من الإعدادات + لم يتم تخطيه مؤخراً من قبل هذا المتصفح
            if (adSettings.shortjambo !== false && !hasShortjamboCooldown) {
                try {
                    const reqUrl = `https://short-jambo.com/api?api=${SHORT_JAMBO_API}&url=${encodeURIComponent(shortjamboCompletionUrl)}`;
                    const response = await axios.get(reqUrl);
                    if (response.data && response.data.status === 'success') {
                        urls.shortjambo = response.data.shortenedUrl;
                    }
                } catch (err) {
                    console.error("Short Jambo API Error", err.message);
                }
            }

            // إذا كانت جميع الشبكات الإعلانية معطلة في الإعدادات، يتم إظهار المحتوى المباشر
            if (!urls.lootlabs && !urls.linkvertise && !urls.shortjambo) {
                const isUrlCheck = data.url.trim().startsWith("http");
                if (!isUrlCheck) {
                    urls.text = data.url; 
                } else {
                    urls.direct = data.url; 
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
