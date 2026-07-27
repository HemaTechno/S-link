import db from "./firebase.js";

export default async function handler(req, res) {
    // 1. GET Method: Fetch all data for the dashboard
    if (req.method === "GET") {
        try {
            const snapshot = await db.collection("links").get();
            let linksData = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                linksData.push({
                    id: doc.id,
                    url: data.url || "",
                    clicks: data.clicks || 0,
                    completedTasksCount: data.completedTasksCount || 0, 
                    lootlabsCompletions: data.lootlabsCompletions || 0,       // تم إضافة عداد LootLabs
                    linkvertiseCompletions: data.linkvertiseCompletions || 0, // تم إضافة عداد Linkvertise
                    createdAt: data.createdAt || Date.now(),
                    tier: data.tier || 1,
                    tasks: data.tasks || 3,
                    analyticsSummary: data.analyticsSummary || []
                });
            });

            // Sort by newest first by default
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

    // 2. PUT Method: Update content/URL from the dashboard
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

            await docRef.update({ url: url });
            
            return res.status(200).json({ success: true, message: "Content updated successfully" });

        } catch (err) {
            console.error("Update Error:", err);
            return res.status(500).json({ success: false, message: "Failed to update content", error: err.message });
        }
    }

    // 3. DELETE Method: Delete content from the dashboard
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

    // Fallback if the method isn't GET, PUT, or DELETE
    return  res.status(405).json({
        success: false,
        message: "Method Not Allowed"
    });
}
