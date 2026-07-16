import db from "./firebase.js";
import { nanoid } from "nanoid";
import axios from "axios";

// ضع مفتاح LootLabs هنا
const LOOTLABS_API = "d2cc58f8084e256f9a15e41ab3971855c0289ed29a00dbf681e31b8b237ace81";

// Cache لمدة دقيقة
const cache = new Map();

export default async function handler(req, res) {

    // ==========================
    // إنشاء رابط
    // ==========================
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

    // ==========================
    // فتح الرابط
    // ==========================
    if (req.method === "GET") {
        const id = req.query.id;
        let originalUrl = "";

        try {
            if (!id)
                return res.status(404).send("Not Found");

            const doc = await db.collection("links").doc(id).get();

            if (!doc.exists)
                return res.status(404).send("الرابط غير موجود");

            const data = doc.data();
            originalUrl = data.url; // حفظ الرابط الأصلي لاستخدامه كـ fallback آمن

            // زيادة عدد الزيارات
            await doc.ref.update({
                clicks: (data.clicks || 0) + 1,
                lastVisit: Date.now()
            });

            // ==========================
            // استخدام الكاش
            // ==========================
            const cached = cache.get(id);

            if (cached && cached.expire > Date.now() && cached.url) {
                return res.redirect(302, cached.url);
            }

            // ==========================
            // إنشاء LootLabs Link
            // ==========================
            const response = await axios.post(
                "https://creators.lootlabs.gg/api/public/content_locker",
                {
                    title: id,
                    url: originalUrl,
                    tier_id: 1,
                    number_of_tasks: 3,
                    theme: 1
                },
                {
                    headers: {
                        Authorization: `Bearer ${LOOTLABS_API}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            // فحص وتأمين جلب الرابط سواء كانت message مصفوفة (Array) أو كائن (Object)
            const messageData = Array.isArray(response.data?.message) ? response.data.message[0] : response.data?.message;
            const lootUrl = messageData?.loot_url || response.data?.loot_url;

            if (lootUrl) {
                // حفظ الرابط في الكاش لمدة دقيقة
                cache.set(id, {
                    url: lootUrl,
                    expire: Date.now() + 60000
                });

                return res.redirect(302, lootUrl);
            } else {
                // إذا لم يرجع الـ API رابط، نقوم بالتحويل للرابط الأصلي مباشرة منعاً للإيرور
                console.error("LootLabs custom error: URL structure is missing in response", response.data);
                return res.redirect(302, originalUrl);
            }

        } catch (err) {
            console.error("LootLabs API Error Details:", err.response?.data || err.message);

            // في حالة فشل LootLabs تماماً يحول للرابط الأصلي فوراً
            if (originalUrl) {
                return res.redirect(302, originalUrl);
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
