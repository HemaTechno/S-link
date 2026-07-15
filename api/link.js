import db from "./firebase.js";
import { nanoid } from "nanoid";

export default async function handler(req, res) {

    // إنشاء رابط مختصر
    if (req.method === "POST") {

        const { url } = req.body;

        if (!url)
            return res.status(400).json({
                success: false,
                message: "URL مطلوب"
            });

        try {

            const id = nanoid(6);

            await db.collection("links").doc(id).set({
                url,
                clicks: 0
            });

            return res.json({
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

        const id = req.query.id;

        if (!id)
            return res.status(404).send("Not Found");

        const doc = await db.collection("links").doc(id).get();

        if (!doc.exists)
            return res.status(404).send("الرابط غير موجود");

        const data = doc.data();

        await doc.ref.update({
            clicks: data.clicks + 1
        });

        return res.redirect(data.url);

    }

    res.status(405).send("Method Not Allowed");

}
