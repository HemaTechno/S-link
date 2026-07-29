import db from "./firebase.js";

export default async function handler(req, res) {
    if (req.method === "GET") {
        try {
            const snapshot = await db.collection("hubs").get();
            let gamesData = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                const processedScripts = (data.scripts || []).map(script => {
                    let value = (script.url || "").trim();
                    const match = value.match(/https?:\/\/[^")']+/);

                    return {
                        name: script.name || "Unnamed Script",
                        type: match ? "loadstring" : "url",
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
                scripts: scripts, 
                updatedAt: Date.now()
            });

            return res.status(200).json({ success: true, message: "Game scripts saved!" });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    // تأكد من وجود هذا الجزء الخاص بالحذف (DELETE)
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
