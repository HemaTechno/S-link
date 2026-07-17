import db from "./firebase.js";
import { nanoid } from "nanoid";
import axios from "axios";

// مفتاح LootLabs الخاص بك
const LOOTLABS_API = "d2cc58f8084e256f9a15e41ab3971855c0289ed29a00dbf681e31b8b237ace81";

// الكاش لحفظ الروابط + محاربة السبام (Rate Limiting)
const cache = new Map();
const spamCache = new Map(); 

// الحد الأقصى لإنشاء الروابط: 5 روابط لكل IP في الدقيقة
const RATE_LIMIT_WINDOW = 60 * 1000; // دقيقة واحدة
const MAX_REQUESTS = 5;

export default async function handler(req, res) {

    // جلب الـ IP الخاص بالمستخدم لمحاربة السبام
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress || "unknown";

    // =======================================================
    // 1. إنشاء رابط (POST) + حماية ضد السبام
    // =======================================================
    if (req.method === "POST") {
        try {
            // ---- نظام محاربة السبام (Rate Limiting) ----
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
    // 2. تعديل رابط محفوظ (PUT) - الميزة الجديدة 💾
    // =======================================================
    if (req.method === "PUT") {
        try {
            const { id, url } = req.body;

            if (!id || !url) {
                return res.status(400).json({ success: false, message: "المعرف والرابط الجديد مطلوبان" });
            }

            const docRef = db.collection("links").doc(id);
            const doc = await docRef.get();

            if (!doc.exists) {
                return res.status(404).json({ success: false, message: "الرابط غير موجود في قاعدة البيانات" });
            }

            // تحديث الحقل في الفايربيس
            await docRef.update({ url: url });

            // تنظيف الكاش القديم الخاص بالرابط إن وجد لضمان التحديث الفوري
            cache.delete(id);

            return res.status(200).json({ success: true, message: "تم تحديث الرابط بنجاح" });

        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    // =======================================================
    // 3. حذف رابط نهائياً (DELETE) - الميزة الجديدة 🗑️
    // =======================================================
    if (req.method === "DELETE") {
        try {
            const { id } = req.body;

            if (!id) {
                return res.status(400).json({ success: false, message: "معرف الرابط (ID) مطلوب للحذف" });
            }

            const docRef = db.collection("links").doc(id);
            const doc = await docRef.get();

            if (!doc.exists) {
                return res.status(404).json({ success: false, message: "الرابط المراد حذفه غير موجود" });
            }

            // مسح المستند نهائياً من الفايربيس
            await docRef.delete();

            // تنظيف الكاش
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
            if (cached && cached.expire > Date.now() && cached.url) {
                return res.redirect(302, cached.url);
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
                return res.redirect(302, lootUrl);
            } else {
                console.error("LootLabs error: URL missing in response", response.data);
                return res.redirect(302, originalUrl);
            }

        } catch (err) {
            console.error("LootLabs API Error Details:", err.response?.data || err.message);
            if (originalUrl) return res.redirect(302, originalUrl);

            return res.status(500).json({
                success: false,
                message: "LootLabs API Error",
                error: err.response?.data || err.message
            });
        }
    }

    return res.status(405).send("Method Not Allowed");
}
