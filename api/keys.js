import db from "./firebase.js";

export default async function handler(req, res) {
    // 1. جلب كل المفاتيح من مجموعة keys
    if (req.method === "GET") {
        try {
            const snapshot = await db.collection("keys").get();
            let keysList = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                keysList.push({
                    key: doc.id,
                    expiresAt: data.expiresAt || 0,
                    hwid: data.hwid || "N/A"
                });
            });

            return res.status(200).json({ success: true, keys: keysList });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    // 2. حذف مفتاح محدد
    if (req.method === "DELETE") {
        try {
            const { key, adminKey } = req.body;
            if (adminKey !== "MY_SECRET_ADMIN_PASSWORD") {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            if (!key) {
                return res.status(400).json({ success: false, message: "Key is required" });
            }

            await db.collection("keys").doc(key).delete();
            return res.status(200).json({ success: true, message: "Key deleted successfully!" });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    return res.status(405).json({ success: false, message: "Method Not Allowed" });
}
