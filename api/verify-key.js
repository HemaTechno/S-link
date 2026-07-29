import db from "./firebase.js";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, message: "Method Not Allowed" });
    }

    const { key } = req.body;

    if (!key) {
        return res.status(400).json({ success: false, message: "Key is required" });
    }

    try {
        // البحث عن المفتاح في قاعدة البيانات
        const keyRef = db.collection("keys").doc(key);
        const doc = await keyRef.get();

        if (!doc.exists) {
            return res.status(404).json({ success: false, message: "Invalid key" });
        }

        const keyData = doc.data();
        const currentTime = Date.now();

        // التحقق مما إذا انتهت صلاحية المفتاح (24 ساعة = 86400000 ميلي ثانية)
        if (currentTime > keyData.expiresAt) {
            return res.status(400).json({ success: false, message: "Key has expired" });
        }

        return res.status(200).json({ success: true, message: "Key is valid" });

    } catch (err) {
        return res.status(500).json({ success: false, message: "Server error" });
    }
}
