import db from "./firebase.js";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, message: "Method Not Allowed" });
    }

    const { key, hwid } = req.body;

    if (!key || !hwid) {
        return res.status(400).json({ success: false, message: "Key and HWID are required" });
    }

    try {
        const keyRef = db.collection("keys").doc(key);
        const doc = await keyRef.get();

        if (!doc.exists) {
            return res.status(404).json({ success: false, message: "Invalid key! Please generate a new one." });
        }

        const keyData = doc.data();
        const currentTime = Date.now();

        // 1. التحقق من الوقت (24 ساعة)
        if (currentTime > keyData.expiresAt) {
            await keyRef.delete(); // مسح المفتاح المنتهي لتنظيف الداتا بيز
            return res.status(400).json({ success: false, message: "Key has expired! Get a new one." });
        }

        // 2. نظام منع المشاركة (Anti-Share)
        if (keyData.hwid !== hwid) {
            await keyRef.delete(); // مسح المفتاح فوراً لأنه تم تسريبه
            return res.status(403).json({ success: false, message: "Key Sharing Detected! Your key has been DESTROYED." });
        }

        return res.status(200).json({ success: true, message: "Key is valid" });

    } catch (err) {
        return res.status(500).json({ success: false, message: "Server error" });
    }
}
