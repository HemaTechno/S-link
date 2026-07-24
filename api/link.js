import db from "./firebase.js";
import { nanoid } from "nanoid";
import axios from "axios";

const LOOTLABS_API = "d2cc58f8084e256f9a15e41ab3971855c0289ed29a00dbf681e31b8b237ace81";

const cache = new Map();
const spamCache = new Map(); 

const RATE_LIMIT_WINDOW = 60 * 1000; 
const MAX_REQUESTS = 5;

// Glassmorphism UI Generation (English version with Logo)
const generatePageHtml = (title, linkName, targetUrl, messageTitle) => `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<script>(function(s){s.dataset.zone='11383401',s.src='https://al5sm.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
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
        
        /* تنسيق اللوجو */
        .logo-container { text-align: center; margin-bottom: 25px; }
        .logo-container img { max-width: 180px; height: auto; display: inline-block; }

        h1 { color: var(--primary); margin-bottom: 15px; font-size: 1.8rem; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 10px; text-shadow: 0px 2px 10px rgba(255, 215, 0, 0.2); }
        .desc { color: var(--text-muted); margin-bottom: 30px; font-size: 1.1rem; line-height: 1.6; word-break: break-all; }
        .warning-box {
            background: rgba(255, 80, 80, 0.05); border: 1px solid rgba(248, 113, 113, 0.3);
            color: #f87171; padding: 18px; border-radius: 16px; margin-bottom: 25px; font-weight: 600; font-size: 15px; line-height: 1.6;
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
        <!-- اللوجو -->
        <div class="logo-container">
            <img src="/logo.png" alt="Website Logo">
        </div>

        <h1><i class="fa-solid fa-shield-halved"></i> ${messageTitle}</h1>
        <div class="desc">Link Name: <strong>${linkName}</strong></div>
        
        <div class="warning-box">
            <i class="fa-solid fa-triangle-exclamation"></i> 
            <strong>Attention:</strong> page contains pop-up ads. Please close them when they appear.
        </div>

        <a href="${targetUrl}" class="btn">
            Click here to get the link <i class="fa-solid fa-arrow-right"></i>
        </a>
    </div>
</body>
</html>
`;

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
                return res.status(400).json({ success: false, message: "URL is required" });
            }

            let id;
            if (slug && slug.trim() !== "") {
                id = slug.trim().toLowerCase();
                if (!/^[a-zA-Z0-9_-]{3,30}$/.test(id)) {
                    return res.status(400).json({ success: false, message: "Invalid link name" });
                }
            } else {
                id = nanoid(6);
            }

            const exists = await db.collection("links").doc(id).get();
            if (exists.exists) {
                return res.status(400).json({ success: false, message: "Link name is already in use" });
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
            if (!id || !url) return res.status(400).json({ success: false, message: "ID and new URL are required" });
            const docRef = db.collection("links").doc(id);
            const doc = await docRef.get();
            if (!doc.exists) return res.status(404).json({ success: false, message: "Link not found in database" });
            await docRef.update({ url: url });
            cache.delete(id);
            return res.status(200).json({ success: true, message: "Link updated successfully" });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    if (req.method === "DELETE") {
        try {
            const { id } = req.body;
            if (!id) return res.status(400).json({ success: false, message: "Link ID is required for deletion" });
            const docRef = db.collection("links").doc(id);
            const doc = await docRef.get();
            if (!doc.exists) return res.status(404).json({ success: false, message: "Link to be deleted not found" });
            await docRef.delete();
            cache.delete(id);
            return res.status(200).json({ success: true, message: "Link deleted successfully" });
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
            if (!doc.exists) return res.status(404).send("Link not found");

            const data = doc.data();
            originalUrl = data.url;

            const cached = cache.get(id);
            
            res.setHeader("Content-Type", "text/html; charset=utf-8");

            if (cached && cached.expire > Date.now() && cached.url) {
                return res.status(200).send(generatePageHtml("Redirecting...", id, cached.url, "Redirecting to Verification"));
            }

            const completionUrl = `https://subx.click/api/complete?id=${id}&tc=[tc]`;

            const response = await axios.post(
                "https://creators.lootlabs.gg/api/public/content_locker",
                {
                    title: id,
                    url: completionUrl,                  
                    tier_id: data.tier || 1,             
                    number_of_tasks: data.tasks || 3,    
                    theme: 1
                },
                {
                    headers: {
                        Authorization: `Bearer ${LOOTLABS_API}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            const messageData = Array.isArray(response.data?.message) ? response.data.message[0] : response.data?.message;
            const lootUrl = messageData?.loot_url || response.data?.loot_url;

            if (lootUrl) {
                cache.set(id, {
                    url: lootUrl,
                    expire: Date.now() + 60000
                });
                return res.status(200).send(generatePageHtml("Redirecting...", id, lootUrl, "Redirecting to Verification"));
            } else {
                console.error("LootLabs error: URL missing in response", response.data);
                return res.status(200).send(generatePageHtml("Redirecting...", id, originalUrl, "Direct Final Link"));
            }

        } catch (err) {
            console.error("LootLabs API Error Details:", err.response?.data || err.message);
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            
            if (originalUrl) {
                return res.status(200).send(generatePageHtml("Redirecting...", id, originalUrl, "Direct Final Link"));
            }

            return res.status(500).json({
                success: false,
                message: "LootLabs API Error",
                error: err.response?.data || err.message
            });
        }
    }

    return res.status(405).send("Method Not Allowed");
}
