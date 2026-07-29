import db from "./firebase.js";

export default async function handler(req, res) {
    // جلب قائمة المابات والسكربتات
    if (req.method === "GET") {
        try {
            const snapshot = await db.collection("hubs").get();
            let gamesData = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                gamesData.push({
                    id: doc.id,
                    gameName: data.gameName || "Unknown Game",
                    placeId: data.placeId || "", // اختياري للتعرف التلقائي
                    scripts: data.scripts || [] // قائمة تحتوي على [{ name: "Script 1", url: "https://..." }]
                });
            });

            return res.status(200).json({ success: true, games: gamesData });
        } catch (err) {
            return res.status(500).json({ success: false, message: "Error fetching scripts" });
        }
    }

    // إضافة أو تعديل ماب وسكربتات (من لوحة التحكم)
    if (req.method === "POST") {
        try {
            const { gameName, placeId, scripts, adminKey } = req.body;
            if (adminKey !== "MY_SECRET_ADMIN_PASSWORD") {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            if (!gameName || !scripts) {
                return res.status(400).json({ success: false, message: "Missing data" });
            }

            const docId = gameName.toLowerCase().replace(/\s+/g, '-');
            await db.collection("hubs").doc(docId).set({
                gameName,
                placeId: placeId || "",
                scripts: scripts, // array of { name, url }
                updatedAt: Date.now()
            });

            return res.status(200).json({ success: true, message: "Game scripts saved!" });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    // حذف ماب
    if (req.method === "DELETE") {
        try {
            const { id, adminKey } = req.body;
            if (adminKey !== "MY_SECRET_ADMIN_PASSWORD") {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            await db.collection("hubs").doc(id).delete();
            return res.status(200).json({ success: true, message: "Game deleted successfully!" });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    return res.status(405).json({ success: false, message: "Method Not Allowed" });
}
