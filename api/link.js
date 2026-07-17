import db from "./firebase.js";
import { nanoid } from "nanoid";
import axios from "axios";
import admin from "firebase-admin"; // استيراد الفايربيس لزيادة العداد تلقائياً

// مفتاح LootLabs الخاص بك
const LOOTLABS_API = "d2cc58f8084e256f9a15e41ab3971855c0289ed29a00dbf681e31b8b237ace81";

// الكاش لحفظ الروابط + محاربة السبام (Rate Limiting)
const cache = new Map();
const spamCache = new Map(); 

// الحد الأقصى لإنشاء الروابط: 5 روابط لكل IP في الدقيقة
const RATE_LIMIT_WINDOW = 60 * 1000; // دقيقة واحدة
const MAX_REQUESTS = 5;

export default async function handler(req, res) {

    // جلب الـ IP الخاص بالمستخدم لمحاربة السبام وتحديد الدولة
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress || "unknown";

    // =======================================================
    // 1. إنشاء رابط (POST) + حماية ضد السبام + تفعيل الـ Dynamic Tiers
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
                return res.status(400).json({
                    success: false,
                    message: "URL مطلوب"
                });
            }

            let id;
            if (slug && slug.trim() !== "") {
                id = slug.trim().toLowerCase();
                if (!/^[a-zA-Z0-9_-]{3,30}$/.test(id)) {
                    return res.status(400).json({
                        success: false,
                        message: "اسم الرابط غير صالح"
                    });
                }
            } else {
                id = nanoid(6);
            }

            const exists = await db.collection("links").doc(id).get();
            if (exists.exists) {
                return res.status(400).json({
                    success: false,
                    message: "اسم الرابط مستخدم بالفعل"
                });
            }

            await db.collection("links").doc(id).set({
                url,
                clicks: 0,
                completedTasksCount: 0, 
                createdAt: Date.now(),
                lastVisit: null,
                tier: tier ? parseInt(tier) : 1,       
                tasks: tasks ? parseInt(tasks) : 3      
            });

            return res.status(200).json({
                success: true,
                short: `${req.headers.origin}/${id}`
            });

        } catch (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }
    }

    // =======================================================
    // 2. فتح الرابط (GET) وتحويل المستخدم إلى LootLabs
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

            // تحديث العداد ووقت آخر زيارة في قاعدة البيانات فوراً عند الدخول بالـ GET
            await db.collection("links").doc(id).update({
                clicks: admin.firestore.FieldValue.increment(1),
                lastVisit: Date.now()
            });

            // استخدام الكاش للرابط المولد لتجنب استدعاء الـ API بكثرة
            const cached = cache.get(id);
            if (cached && cached.expire > Date.now() && cached.url) {
                return res.redirect(302, cached.url);
            }

            // [تعديل الـ Anti-Bypass الأساسي]
            // نمرر المتغير [tc] في الرابط لتقوم LootLabs بتبديله تلقائياً بـ Token فريد للعملية عند التحويل
            const completionUrl = `https://subx.click/api/complete?id=${id}&tc=[tc]`;

            // إنشاء الرابط عبر LootLabs
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
