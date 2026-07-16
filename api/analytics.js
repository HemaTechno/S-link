import db from "./firebase.js";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).send("Method Not Allowed");
    }

    try {
        const snapshot = await db.collection("links").get();
        let linksData = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            linksData.push({
                id: doc.id,
                url: data.url || "",
                clicks: data.clicks || 0,
                completedTasksCount: data.completedTasksCount || 0, // جلب عدد المهام المكتملة
                createdAt: data.createdAt || Date.now(),
                tier: data.tier || 1,
                tasks: data.tasks || 3,
                analyticsSummary: data.analyticsSummary || []
            });
        });

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
