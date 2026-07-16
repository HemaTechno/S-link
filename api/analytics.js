import db from "./firebase.js";

export default async function handler(req, res) {
    // نسمح فقط بطلب الـ GET لجلب البيانات
    if (req.method !== "GET") {
        return res.status(405).send("Method Not Allowed");
    }

    try {
        // جلب كل المستندات من كوليكشن الروابط
        const snapshot = await db.collection("links").get();
        
        let linksData = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            linksData.push({
                id: doc.id,
                url: data.url || "",
                clicks: data.clicks || 0,
                createdAt: data.createdAt || Date.now(),
                tier: data.tier || 1,
                tasks: data.tasks || 3,
                analyticsSummary: data.analyticsSummary || [] // مصفوفة الزيارات اللي سجلناها
            });
        });

        // إرجاع البيانات بنجاح للسيرفر
        return res.status(200).json({
            success: true,
            links: linksData
        });

    } catch (err) {
        console.error("Analytics API Error:", err);
        return res.status(500).json({
            success: false,
            message: "فشل جلب بيانات الإحصائيات",
            error: err.message
        });
    }
}
