import db from "./firebase.js";

// 🔴 توحيد الباسورد ليكون متطابقاً مع لوحة التحكم وباقي الملفات
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Hema123i#";

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
                    // إذا لم تكن هناك بصمة (مفتاح عام) ستظهر كفارغة ليقرأها النظام
                    hwid: data.hwid || "" 
                });
            });

            // ترتيب المفاتيح من الأحدث للأقدم
            keysList.sort((a, b) => b.expiresAt - a.expiresAt);

            return res.status(200).json({ success: true, keys: keysList });
        } catch (err) {
            console.error("Error fetching keys:", err);
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    // 2. حذف مفتاح محدد
    if (req.method === "DELETE") {
        try {
            // 🟢 [التصليح هنا]: حماية الكود من الانهيار إذا لم يتعرف السيرفر على الـ Body في طلبات DELETE
            let body = req.body || {};
            if (typeof body === "string") {
                try { 
                    body = JSON.parse(body); 
                } catch (e) {
                    console.error("Failed to parse DELETE body:", e);
                }
            }

            const { key, adminKey } = body;
            
            // ✅ استخدام الباسورد الموحد
            if (adminKey !== ADMIN_PASSWORD) {
                return res.status(401).json({ success: false, message: "Unauthorized: Invalid Admin Password" });
            }

            if (!key) {
                return res.status(400).json({ success: false, message: "Key is required" });
            }

            await db.collection("keys").doc(key).delete();
            return res.status(200).json({ success: true, message: "Key deleted successfully!" });
        } catch (err) {
            console.error("Error deleting key:", err);
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    return res.status(405).json({ success: false, message: "Method Not Allowed" });
}
