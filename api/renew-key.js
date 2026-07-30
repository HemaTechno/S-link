import db from "../firebase.js";

// ضع باسورد الأدمن هنا (يجب أن يكون نفس الباسورد المستخدم في لوحة التحكم)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Hema123i#"; 

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: "Method Not Allowed" });
    }

    const { adminKey, key, hours } = req.body;

    // 1. التحقق من باسورد الأدمن
    if (adminKey !== ADMIN_PASSWORD) {
        return res.status(403).json({ success: false, message: "Invalid Admin Password!" });
    }

    // 2. التحقق من المدخلات
    if (!key || !hours || isNaN(hours) || hours <= 0) {
        return res.status(400).json({ success: false, message: "Invalid key or hours provided." });
    }

    try {
        const keyRef = db.collection("keys").doc(key);
        const keyDoc = await keyRef.get();

        // 3. التأكد أن المفتاح موجود
        if (!keyDoc.exists) {
            return res.status(404).json({ success: false, message: "Key not found!" });
        }

        // 4. حساب وقت الانتهاء الجديد
        const currentData = keyDoc.data();
        const currentExpiry = currentData.expiresAt || Date.now();
        
        // إذا كان المفتاح منتهياً بالفعل، نبدأ الحساب من الآن، وإلا نضيف على الوقت المتبقي
        const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
        const newExpiry = baseTime + (hours * 60 * 60 * 1000);

        // 5. تحديث المفتاح في قاعدة البيانات
        await keyRef.update({
            expiresAt: newExpiry
        });

        return res.status(200).json({ success: true, message: `Key renewed successfully for ${hours} hours.` });

    } catch (error) {
        console.error("Error renewing key:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
}
