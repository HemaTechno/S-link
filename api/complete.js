import db from "./firebase.js";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).send("Method Not Allowed");
    }

    const { id } = req.query;

    if (!id) {
        return res.status(400).send("Missing Link ID");
    }

    try {
        const doc = await db.collection("links").doc(id).get();

        if (!doc.exists) {
            return res.status(404).send("الرابط غير موجود");
        }

        const data = doc.data();

        // 1. تحديث قاعدة البيانات لتسجيل أن المهمة اكتملت بنجاح لزيادة العداد
        await doc.ref.update({
            completedTasksCount: (data.completedTasksCount || 0) + 1,
            lastCompletedAt: Date.now()
        });

        // 2. تحويل المستخدم فوراً وبانسيابية إلى الرابط الأصلي النهائي
        return res.redirect(302, data.url);

    } catch (err) {
        console.error("Error in completion handler:", err);
        // في أسوأ الظروف، نقوم بتحويل الزائر للرابط الأصلي حتى لا يخرب تجربة المستخدم
        try {
            const doc = await db.collection("links").doc(id).get();
            if (doc.exists) {
                return res.redirect(302, doc.data().url);
            }
        } catch {}
        return res.status(500).send("حدث خطأ أثناء معالجة طلب إكمال المهمة");
    }
}
