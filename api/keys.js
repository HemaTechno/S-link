import db from "./firebase.js";
import { nanoid } from "nanoid"; // 🔴 مهم جداً لتوليد المفاتيح العشوائية

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Hema123i#";

export default async function handler(req, res) {
    // 1. جلب كل المفاتيح (GET)
    if (req.method === "GET") {
        try {
            const snapshot = await db.collection("keys").get();
            let keysList = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                keysList.push({
                    key: doc.id,
                    expiresAt: data.expiresAt || 0,
                    hwid: data.hwid || "" 
                });
            });

            keysList.sort((a, b) => b.expiresAt - a.expiresAt);
            return res.status(200).json({ success: true, keys: keysList });
        } catch (err) {
            console.error("Error fetching keys:", err);
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    // --- حماية قراءة البيانات لطلبات POST و DELETE ---
    let body = req.body || {};
    if (typeof body === "string") {
        try { body = JSON.parse(body); } catch (e) {}
    }

    // 2. معالجة طلبات التحكم (إنشاء أو حذف)
    if (req.method === "POST" || req.method === "DELETE") {
        const { adminKey, action, key, hours, hwid } = body;
        
        // التحقق من الباسورد
        if (adminKey !== ADMIN_PASSWORD) {
            return res.status(401).json({ success: false, message: "Unauthorized: Invalid Admin Password" });
        }

        // 🟢 أ. حالة إنشاء مفتاح جديد (Create)
        if (action === "create" || hours) {
            try {
                const uniqueKey = "SUBX-" + nanoid(10).toUpperCase();
                const expiresAt = Date.now() + (parseInt(hours) * 60 * 60 * 1000); // تحويل الساعات لميلي ثانية
                
                await db.collection("keys").doc(uniqueKey).set({
                    key: uniqueKey,
                    createdAt: Date.now(),
                    expiresAt: expiresAt,
                    hwid: hwid || "", // حفظ البصمة أو تركها فارغة للمفتاح العام
                    ip: "Admin Dashboard"
                });

                return res.status(200).json({ success: true, key: uniqueKey });
            } catch (err) {
                console.error("Error creating key:", err);
                return res.status(500).json({ success: false, message: "Error creating key in database" });
            }
        }

        // 🔴 ب. حالة حذف مفتاح (Delete)
        if (action === "delete" || key || req.method === "DELETE") {
            if (!key) {
                return res.status(400).json({ success: false, message: "Key is required" });
            }
            try {
                await db.collection("keys").doc(key).delete();
                return res.status(200).json({ success: true, message: "Key deleted successfully!" });
            } catch (err) {
                console.error("Error deleting key:", err);
                return res.status(500).json({ success: false, message: "Error deleting key" });
            }
        }
    }

    return res.status(405).json({ success: false, message: "Method Not Allowed" });
}
