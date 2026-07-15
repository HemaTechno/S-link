import db from "./firebase.js";
import { nanoid } from "nanoid";

// معرف الناشر الخاص بك في Linkvertise
const LINKVERTISE_USER_ID = 1322389; 

export default async function handler(req, res) {

    // 1. إنشاء الرابط (POST) - لوحة التحكم تتواصل مع هذا الجزء
    if (req.method === "POST") {
        try {
            const { url, slug } = req.body;

            if (!url) {
                return res.status(400).json({ success: false, message: "URL مطلوب" });
            }

            let id = slug && slug.trim() !== "" ? slug.trim().toLowerCase() : nanoid(6);

            if (slug && !/^[a-zA-Z0-9_-]{3,30}$/.test(id)) {
                return res.status(400).json({ success: false, message: "اسم الرابط غير صالح" });
            }

            const exists = await db.collection("links").doc(id).get();
            if (exists.exists) {
                return res.status(400).json({ success: false, message: "اسم الرابط مستخدم بالفعل" });
            }

            await db.collection("links").doc(id).set({
                url,
                clicks: 0,
                createdAt: Date.now()
            });

            return res.status(200).json({
                success: true,
                short: `${req.headers.origin}/${id}`
            });

        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    // 2. التحويل الفوري والمباشر لـ Linkvertise (GET) - المتابع يدخل هنا مباشرة
    if (req.method === "GET") {
        try {
            const id = req.query.id;
            if (!id) return res.status(404).send("Not Found");

            // جلب الرابط من الفايربيس
            const doc = await db.collection("links").doc(id).get();
            if (!doc.exists) return res.status(404).send("الرابط غير موجود");

            const data = doc.data();

            // تحديث عداد النقرات في الداتا
            await doc.ref.update({
                clicks: (data.clicks || 0) + 1
            });

            // الخطوة أ: تشفير الرابط الأصلي بصيغة Standard Base64
            const standardBase64 = Buffer.from(data.url).toString("base64");

            // الخطوة ب: تحويل الرموز لـ URL Safe لكي يقرأها سيرفر Linkvertise كاملة بدون نقص
            const encodedBase64 = encodeURIComponent(standardBase64);

            // الخطوة ج: بناء رابط الأرباح الديناميكي الخاص بك
            const linkvertiseRedirectUrl = `https://linkvertise.com/${LINKVERTISE_USER_ID}/dynamic?r=${encodedBase64}`;

            // تحويل الزائر فوراً (302 Redirect) إلى Linkvertise ليتخطى الإعلانات
            return res.redirect(302, linkvertiseRedirectUrl);

        } catch (err) {
            return res.status(500).send("Internal Server Error");
        }
    }

    return res.status(405).send("Method Not Allowed");
} 
