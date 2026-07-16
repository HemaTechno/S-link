 import db from "./firebase.js";
import { nanoid } from "nanoid";

export default async function handler(req, res) {

    // إنشاء رابط مختصر
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

            // حفظ الرابط
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

    // التحويل للرابط
    if (req.method === "GET") {

        try {

            const id = req.query.id;

            if (!id)
                return res.status(404).send("Not Found");

            const doc = await db.collection("links").doc(id).get();

            if (!doc.exists)
                return res.status(404).send("الرابط غير موجود");

            const data = doc.data();

            await doc.ref.update({
                clicks: (data.clicks || 0) + 1
            });

            return res.redirect(302, data.url);

        } catch (err) {

            return res.status(500).send("Inter nal Server Error");

        }

    }

    return res.status(405).send("Method Not Allowed");

} 
