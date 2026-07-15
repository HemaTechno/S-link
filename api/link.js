import db from "./firebase.js";
import { nanoid } from "nanoid";

// معرف الناشر الخاص بك في Linkvertise
const LINKVERTISE_USER_ID = 1322389; 

export default async function handler(req, res) {

    // 1. إنشاء الرابط المختصر (POST)
    if (req.method === "POST") {
        try {
            const { url, slug } = req.body;

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

            // التأكد إن الاسم غير مستخدم
            const exists = await db.collection("links").doc(id).get();
            if (exists.exists) {
                return res.status(400).json({
                    success: false,
                    message: "اسم الرابط مستخدم بالفعل"
                });
            }

            // حفظ الرابط الأصلي في قاعدة البيانات
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
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }
    }

    // 2. التحويل التلقائي والدمج الآمن مع Linkvertise (GET)
    if (req.method === "GET") {
        try {
            // جلب الـ id سواء جاء كـ query parameter أو تم تمريره عبر مسار التوجيه
            const id = req.query.id;

            if (!id) return res.status(404).send("Not Found");

            const doc = await db.collection("links").doc(id).get();
            if (!doc.exists) return res.status(404).send("الرابط غير موجود");

            const data = doc.data();

            // تحديث عداد النقرات في الفايربيس
            await doc.ref.update({
                clicks: (data.clicks || 0) + 1
            });

            // تحويل الرابط إلى صيغة Standard Base64
            let base64Url = Buffer.from(data.url).toString("base64");
            
            // جعل النص المتولد متوافقًا تمامًا مع معايير الروابط (URL-Safe Base64)
            // وهي معالجة الرموز (+، /، =) التي تسبب خللاً في بعض المتصفحات وسيرفرات التحويل
            base64Url = base64Url
                .replace(/\+/g, "-")
                .replace(/\//g, "_")
                .replace(/=+$/, "");

            // بناء الرابط الديناميكي النهائي الصالح للاستخدام الفوري لـ Linkvertise
            const linkvertiseRedirectUrl = `https://linkvertise.com/${LINKVERTISE_USER_ID}/dynamic?r=${base64Url}`;

            // توجيه الزائر مباشرة (HTTP 302 Redirect) إلى صفحة الأرباح
            return res.redirect(302, linkvertiseRedirectUrl);

        } catch (err) {
            return res.status(500).send("Internal Server Error");
        }
    }

    return res.status(405).send("Method Not Allowed");
}
