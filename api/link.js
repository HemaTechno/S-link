import db from "./firebase.js";
import { nanoid } from "nanoid";
import axios from "axios";

// Cache لمدة دقيقة لتقليل استدعاءات LootLabs
const cache = new Map();

export default async function handler(req, res) {

    // ===========================
    // إنشاء رابط مختصر
    // ===========================
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
                createdAt: Date.now(),
                lastVisit: null
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

    // ===========================
    // فتح الرابط
    // ===========================
    if (req.method === "GET") {

        try {

            const id = req.query.id;

            if (!id)
                return res.status(404).send("Not Found");

            const doc = await db.collection("links").doc(id).get();

            if (!doc.exists)
                return res.status(404).send("الرابط غير موجود");

            const data = doc.data();

            // تحديث الإحصائيات
            await doc.ref.update({
                clicks: (data.clicks || 0) + 1,
                lastVisit: Date.now()
            });

            // ===========================
            // استخدام الكاش
            // ===========================
            const cached = cache.get(id);

            if (cached && cached.expires > Date.now()) {

                return res.redirect(302, cached.url);

            }

            // ===========================
            // إنشاء LootLabs Link جديد
            // ===========================
            const response = await axios.post(
                "https://creators.lootlabs.gg/api/public/content_locker",
                {
                    title: id,
                    url: data.url,
                    tier_id: 1,
                    number_of_tasks: 3,
                    theme: 1
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.LOOTLABS_API}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            const lootUrl = response.data.message.loot_url;

            // حفظه في الكاش لمدة دقيقة
            cache.set(id, {
                url: lootUrl,
                expires: Date.now() + 60 * 1000
            });

            return res.redirect(302, lootUrl);

        } catch (err) {

            console.error(err.response?.data || err);

            return res.status(500).json({
                success: false,
                message: "LootLabs API Error",
                error: err.response?.data || err.message
            });

        }

    }

    return res.status(405).send("Method Not Allowed");

}
