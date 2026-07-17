import db from "./firebase.js";
import { nanoid } from "nanoid";

const spamCache = new Map(); 
const RATE_LIMIT_WINDOW = 60 * 1000; // دقيقة
const MAX_REQUESTS = 5;

export default async function handler(req, res) {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress || "unknown";

    // لا نقبل سوى طلبات إنشاء الروابط (POST) في هذا الملف
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, message: "Method Not Allowed" });
    }

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

        // استقبال البيانات
        const { url, slug, tier, tasks, socialTasks } = req.body;

        if (!url) {
            return res.status(400).json({ success: false, message: "URL الأصلي مطلوب" });
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

        const exists = await db.collection("boost_links").doc(id).get();
        if (exists.exists) {
            return res.status(400).json({ success: false, message: "اسم الرابط مستخدم بالفعل" });
        }

        // حفظ البيانات في كولكشن مستقل اسمه boost_links
        await db.collection("boost_links").doc(id).set({
            url,
            createdAt: Date.now(),
            tier: tier ? parseInt(tier) : 1,       
            tasks: tasks ? parseInt(tasks) : 3,
            socialTasks: socialTasks || [] // مثال: [{type: "sub", url: "..."}, {type: "like", url: "..."}]
        });

        // هنا نقوم بتوجيه المستخدم إلى رابط صفحة العرض المستقلة (boost-view)
        const redirectUrl = `${req.headers.origin}/boost-view?id=${id}`;

        return res.status(200).json({
            success: true,
            short: redirectUrl
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: err.message });
    }
}
