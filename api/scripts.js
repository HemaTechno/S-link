import db from "./firebase.js";

export default async function handler(req, res) {
    // 1. جلب المابات والسكربتات
    if (req.method === "GET") {
        try {
            const snapshot = await db.collection("hubs").get();
            let gamesData = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                const processedScripts = (data.scripts || []).map((script, index) => {
                    let value = (script.url || "").trim();
                    const match = value.match(/https?:\/\/[^")']+/);
                    return {
                        id: index, // مؤشر السكربت للتعديل والحذف
                        name: script.name || "Unnamed Script",
                        url: match ? match[0] : value
                    };
                });

                gamesData.push({
                    id: doc.id,
                    gameName: data.gameName || "Unknown Game",
                    placeId: data.placeId || "",
                    scripts: processedScripts
                });
            });

            return res.status(200).json({ success: true, games: gamesData });
        } catch (err) {
            return res.status(500).json({ success: false, message: "Error fetching scripts" });
        }
    }

    // 2. إضافة أو تحديث ماب / سكربت (POST)
    if (req.method === "POST") {
        try {
            const { gameName, placeId, scripts, adminKey } = req.body;
            if (adminKey !== "MY_SECRET_ADMIN_PASSWORD") {
                return res.status(401).json({ success: false, message: "Unauthorized: Invalid Admin Password" });
            }

            if (!gameName) {
                return res.status(400).json({ success: false, message: "Game name is required" });
            }

            const docId = gameName.toLowerCase().replace(/\s+/g, '-');
            const docRef = db.collection("hubs").doc(docId);
            const doc = await docRef.get();

            let existingScripts = doc.exists ? (doc.data().scripts || []) : [];

            // لو تم إرسال سكربتات جديدة، نقوم بدمجها أو تحديثها
            let finalScripts = scripts !== undefined ? scripts : existingScripts;

            await docRef.set({
                gameName,
                placeId: placeId || (doc.exists ? doc.data().placeId : ""),
                scripts: finalScripts,
                updatedAt: Date.now()
            }, { merge: true });

            return res.status(200).json({ success: true, message: "Saved successfully!" });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    // 3. حذف ماب كامل (DELETE)
    if (req.method === "DELETE") {
        try {
            const { id, adminKey } = req.body;
            if (adminKey !== "MY_SECRET_ADMIN_PASSWORD") {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            await db.collection("hubs").doc(id).delete();
            return res.status(200).json({ success: true, message: "Map deleted successfully!" });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    return res.status(405).json({ success: false, message: "Method Not Allowed" });
}
