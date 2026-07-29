import db from "./firebase.js";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, message: "Method Not Allowed" });
    }

    const { key, hwid } = req.body;

    if (!key || !hwid) {
        return res.status(200).json({ success: false, message: "Key and HWID are required" });
    }

    try {
        const keyRef = db.collection("keys").doc(key);
        const doc = await keyRef.get();

        if (!doc.exists) {
            // غيرنا الرد لـ 200 عشان روبلوكس يقرأه صح
            return res.status(200).json({ success: false, message: "Invalid key! Please generate a new one." });
        }

        const keyData = doc.data();
        const currentTime = Date.now();

        if (currentTime > keyData.expiresAt) {
            await keyRef.delete(); 
            return res.status(200).json({ success: false, message: "Key has expired! Get a new one." });
        }

        // 🟢 التعديل هنا: السماح للمفاتيح المخصصة (Universal Keys) بالمرور بدون مشاكل
        if (keyData.hwid !== hwid && keyData.hwid !== "UNIVERSAL_KEY") {
            await keyRef.delete(); 
            return res.status(200).json({ success: false, message: "Key Sharing Detected! Your key has been DESTROYED." });
        }

        return res.status(200).json({ success: true, message: "Key is valid" });

    } catch (err) {
        return res.status(200).json({ success: false, message: "Server error" });
    }
}
