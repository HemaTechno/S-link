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
        // 🔴 التعديل الأول: التحقق مما إذا كانت البصمة محظورة (Ban Check)
        const banCheck = await db.collection("banned_users").doc(hwid).get();
        if (banCheck.exists) {
            return res.status(200).json({ success: false, message: "You are permanently BANNED from SubX Premium!" });
        }

        const keyRef = db.collection("keys").doc(key);
        const doc = await keyRef.get();

        if (!doc.exists) {
            return res.status(200).json({ success: false, message: "Invalid key! Please generate a new one." });
        }

        const keyData = doc.data();
        const currentTime = Date.now();

        if (currentTime > keyData.expiresAt) {
            await keyRef.delete(); 
            return res.status(200).json({ success: false, message: "Key has expired! Get a new one." });
        }

        // 🟢 التعديل الثاني: إصلاح المفاتيح العامة (Universal Keys)
        // إذا كان الأدمن لم يضع بصمة (فارغة أو null) أو كتب "UNIVERSAL_KEY"
        if (!keyData.hwid || keyData.hwid === "" || keyData.hwid === "UNIVERSAL_KEY") {
            
            // 🔥 حركة احترافية (اختيارية): لو أردت أن المفتاح العام يربط نفسه بأول شخص يستخدمه
            // await keyRef.update({ hwid: hwid });

            return res.status(200).json({ 
                success: true, 
                message: "Universal Key is valid",
                expiresAt: keyData.expiresAt // إرسال وقت الانتهاء للسكربت
            });
        }

        // التحقق من مشاركة المفاتيح (Key Sharing)
        if (keyData.hwid !== hwid) {
            await keyRef.delete(); 
            return res.status(200).json({ success: false, message: "Key Sharing Detected! Your key has been DESTROYED." });
        }

        return res.status(200).json({ 
            success: true, 
            message: "Key is valid",
            expiresAt: keyData.expiresAt // إرسال وقت الانتهاء للسكربت ليقرأه
        });

    } catch (err) {
        console.error("Verification error:", err);
        return res.status(200).json({ success: false, message: "Server error" });
    }
}
