import db from "./firebase.js";
import { nanoid } from "nanoid";
import axios from "axios";

const LOOTLABS_API = "d2cc58f8084e256f9a15e41ab3971855c0289ed29a00dbf681e31b8b237ace81";

const cache = new Map();
const spamCache = new Map(); 

const RATE_LIMIT_WINDOW = 60 * 1000; 
const MAX_REQUESTS = 5;

// دالة لتوليد صفحة HTML بألوان وتصميم متناسق
const generatePageHtml = (title, linkName, targetUrl, messageTitle, showSuccess = false) => `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .card { background-color: white; padding: 40px 30px; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); text-align: center; max-width: 400px; width: 90%; }
        h2 { color: #1f2937; margin-bottom: 10px; font-size: 24px; }
        .link-name { color: #4b5563; font-size: 18px; margin-bottom: 25px; word-break: break-all; }
        .warning { color: #b91c1c; background-color: #fef2f2; border: 1px solid #f87171; padding: 15px; border-radius: 8px; margin-bottom: 25px; font-weight: bold; line-height: 1.5; }
        .success { color: #047857; background-color: #d1fae5; border: 1px solid #34d399; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-weight: bold; }
        .btn { background-color: #3b82f6; color: white; padding: 14px 25px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; display: block; transition: background 0.3s; }
        .btn:hover { background-color: #2563eb; }
    </style>
</head>
<body>
    <div class="card">
        ${showSuccess ? `<div class="success">✅ تم التخطي بنجاح!</div>` : `<h2>${messageTitle}</h2>`}
        <div class="link-name">اسم الرابط: <strong>${linkName}</strong></div>
        <div class="warning">⚠️ خلي بالك: الصفحة القادمة تحتوي على إعلانات منبثقة (Pop-up)، يرجى إغلاقها عند ظهورها.</div>
        <a href="${targetUrl}" class="btn">للحصول على الرابط اضغط هنا</a>
    </div>
</body>
</html>
`;

export default async function handler(req, res) {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress || "unknown";

    // =======================================================
    // 1. إنشاء رابط (POST) 
    // =======================================================
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

    // =======================================================
    // 2. تعديل رابط محفوظ (PUT) 
    // =======================================================
    if (req.method === "PUT") {
        // نفس كود التعديل بدون تغيير
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

    // =======================================================
    // 3. حذف رابط نهائياً (DELETE)
    // =======================================================
    if (req.method === "DELETE") {
        // نفس كود الحذف بدون تغيير
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

    // =======================================================
    // 4. فتح وتحويل الرابط (GET)
    // =======================================================
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
            
            // تجهيز الاستجابة كـ HTML
            res.setHeader("Content-Type", "text/html; charset=utf-8");

            if (cached && cached.expire > Date.now() && cached.url) {
                // إرجاع الصفحة بدلاً من التوجيه المباشر
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
                // إرجاع الصفحة بدلاً من التوجيه المباشر
                return res.status(200).send(generatePageHtml("جاري التوجيه...", id, lootUrl, "توجيه إلى منصة التحقق"));
            } else {
                console.error("LootLabs error: URL missing in response", response.data);
                // توجيه للرابط الأصلي في حال فشل LootLabs
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
