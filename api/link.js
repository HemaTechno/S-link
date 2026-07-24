import db from "./firebase.js";
import { nanoid } from "nanoid";
import axios from "axios";

const LOOTLABS_API = "d2cc58f8084e256f9a15e41ab3971855c0289ed29a00dbf681e31b8b237ace81";

const cache = new Map();
const spamCache = new Map(); 

const RATE_LIMIT_WINDOW = 60 * 1000; 
const MAX_REQUESTS = 5;

// دالة التصميم الزجاجي لصفحة التوجيه
const generatePageHtml = (title, linkName, targetUrl, messageTitle) => `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
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
        <h1><i class="fa-solid fa-shield-halved"></i> ${messageTitle}</h1>
        <div class="desc">اسم الرابط: <strong>${linkName}</strong></div>
        
        <div class="warning-box">
            <i class="fa-solid fa-triangle-exclamation"></i> 
            <strong>خلي بالك:</strong> الصفحة القادمة تحتوي على إعلانات منبثقة (Pop-up)، يرجى إغلاقها عند ظهورها.
        </div>

        <a href="${targetUrl}" class="btn">
            للحصول على الرابط اضغط هنا <i class="fa-solid fa-arrow-left"></i>
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
                    message: "طلبات كثيرة جداً! يرجى الانتظار دقيقة قبل إنشاء روابط جديدة."
                });
            }

            const { url, slug, tier, tasks } = req.body;

            if (!url) {
                return res.status(400).json({ success: false, message: "URL مطلوب" });
            }

            let id;
            if (slug && slug.trim() !== "") {
                id = slug.trim().toLowerCase();
                if (!/^[a-zA-Z0-9_-]{3,30}$/.test(id)) {
                    return res.status(400).json({ success: false, message: "اسم الرابط غير صالح" });
                }
            } else {
                id = nanoid(6);
            }

            const exists = await db.collection("links").doc(id).get();
            if (exists.exists) {
                return res.status(400).json({ success: false, message: "اسم الرابط مستخدم بالفعل" });
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
            if (!id || !url) return res.status(400).json({ success: false, message: "المعرف والرابط الجديد مطلوبان" });
            const docRef = db.collection("links").doc(id);
            const doc = await docRef.get();
            if (!doc.exists) return res.status(404).json({ success: false, message: "الرابط غير موجود في قاعدة البيانات" });
            await docRef.update({ url: url });
            cache.delete(id);
            return res.status(200).json({ success: true, message: "تم تحديث الرابط بنجاح" });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    if (req.method === "DELETE") {
        try {
            const { id } = req.body;
            if (!id) return res.status(400).json({ success: false, message: "معرف الرابط (ID) مطلوب للحذف" });
            const docRef = db.collection("links").doc(id);
            const doc = await docRef.get();
            if (!doc.exists) return res.status(404).json({ success: false, message: "الرابط المراد حذفه غير موجود" });
            await docRef.delete();
            cache.delete(id);
            return res.status(200).json({ success: true, message: "تم حذف الرابط بنجاح" });
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
            if (!doc.exists) return res.status(404).send("الرابط غير موجود");

            const data = doc.data();
            originalUrl = data.url;

            const cached = cache.get(id);
            
            res.setHeader("Content-Type", "text/html; charset=utf-8");

            if (cached && cached.expire > Date.now() && cached.url) {
                return res.status(200).send(generatePageHtml("جاري التوجيه...", id, cached.url, "توجيه إلى منصة التحقق"));
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
                return res.status(200).send(generatePageHtml("جاري التوجيه...", id, lootUrl, "توجيه إلى منصة التحقق"));
            } else {
                console.error("LootLabs error: URL missing in response", response.data);
                return res.status(200).send(generatePageHtml("جاري التوجيه...", id, originalUrl, "الرابط النهائي مباشر"));
            }

        } catch (err) {
            console.error("LootLabs API Error Details:", err.response?.data || err.message);
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            
            if (originalUrl) {
                return res.status(200).send(generatePageHtml("جاري التوجيه...", id, originalUrl, "الرابط النهائي مباشر"));
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
