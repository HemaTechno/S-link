import db from "./firebase.js";
import { nanoid } from "nanoid";

// معرف الناشر الخاص بك في Linkvertise
const LINKVERTISE_USER_ID = 1322389; 

export default async function handler(req, res) {

    // 1. إنشاء الرابط (POST) - لوحة التحكم بتكلم الجزء ده
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

    // 2. التحويل الفوري والمباشر لـ Linkvertise (GET) - المتابع بيدخل هنا علطول
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

            // تحويل الرابط لصيغة Base64 آمنة للمتصفحات (URL-Safe Base64) عشان Linkvertise يقبله
            let base64Url = Buffer.from(data.url).toString("base64")
                .replace(/\+/g, "-")
                .replace(/\//g, "_")
                .replace(/=+$/, "");

            // بناء رابط الأرباح الديناميكي الخاص بك
            const linkvertiseRedirectUrl = `https://linkvertise.com/${LINKVERTISE_USER_ID}/dynamic?r=${base64Url}`;

            // تحويل الزائر فوراً (302 Redirect) إلى Linkvertise ليتخطى الإعلانات ثم يفتح معاه الرابط الأصلي
            return res.redirect(302, linkvertiseRedirectUrl);

        } catch (err) {
            return res.status(500).send("Internal Server Error");
        }
    }

    return res.status(405).send("Method Not Allowed");
}
