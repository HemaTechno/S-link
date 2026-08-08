import db from "./firebase.js";

export default async function handler(req, res) {
    // 1) GET Method: جلب المحتوى وإحصائيات كافة الشبكات مع الدعم المزدوج للروابط
    if (req.method === "GET") {
        try {
            const snapshot = await db.collection("links").get();
            let linksData = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                linksData.push({
                    id: doc.id,
                    targetUrl: data.targetUrl || data.url || "",
                    url: data.targetUrl || data.url || "",
                    clicks: data.clicks || 0,
                    completedTasksCount: data.completedTasksCount || 0, 
                    linkjustCompletions: data.linkjustCompletions || 0,  // عداد LinkJust
                    lootlabsCompletions: data.lootlabsCompletions || 0,  // عداد LootLabs
                    linkvertiseCompletions: data.linkvertiseCompletions || 0, // عداد Linkvertise
                    nitrolinkCompletions: data.nitrolinkCompletions || 0,     // عداد Nitro Link
                    createdAt: data.createdAt || Date.now(),
                    tasks: data.tasks || []
                });
            });

            // الترتيب من الأحدث للأقدم
            linksData.sort((a, b) => b.createdAt - a.createdAt);

            return res.status(200).json({
                success: true,
                links: linksData
            });

        } catch (err) {
            console.error("Analytics API Error:", err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch analytics data",
                error: err.message
            });
        }
    }

    // 2) PUT Method: تحديث المحتوى الأصلي (الرابط أو نص السكربت)
    if (req.method === "PUT") {
        try {
            const { id, url } = req.body;
            
            if (!id || !url) {
                return res.status(400).json({ success: false, message: "ID and new content are required" });
            }

            const docRef = db.collection("links").doc(id);
            const doc = await docRef.get();

            if (!doc.exists) {
                return res.status(404).json({ success: false, message: "Content not found in database" });
            }

            // تحديث الحقلين لضمان عمل كافة الملفات القديمة والحديثة
            await docRef.update({ 
                targetUrl: url,
                url: url 
            });
            
            return res.status(200).json({ success: true, message: "Content updated successfully" });

        } catch (err) {
            console.error("Update Error:", err);
            return res.status(500).json({ success: false, message: "Failed to update content", error: err.message });
        }
    }

    // 3) DELETE Method: حذف الرابط من قاعدة البيانات
    if (req.method === "DELETE") {
        try {
            const { id } = req.body;
            
            if (!id) {
                return res.status(400).json({ success: false, message: "ID is required for deletion" });
            }

            const docRef = db.collection("links").doc(id);
            const doc = await docRef.get();

            if (!doc.exists) {
                return res.status(404).json({ success: false, message: "Content to be deleted not found" });
            }

            await docRef.delete();
            
            return res.status(200).json({ success: true, message: "Content deleted successfully" });

        } catch (err) {
            console.error("Delete Error:", err);
            return res.status(500).json({ success: false, message: "Failed to delete content", error: err.message });
        }
    }

    return res.status(405).json({
        success: false,
        message: "Method Not Allowed"
    });
}
