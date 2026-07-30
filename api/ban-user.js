import db from "../firebase.js";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Hema123i#"; 

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: "Method Not Allowed" });
    }

    const { adminKey, hwid } = req.body;

    // 1. التحقق من باسورد الأدمن
    if (adminKey !== ADMIN_PASSWORD) {
        return res.status(403).json({ success: false, message: "Invalid Admin Password!" });
    }

    if (!hwid) {
        return res.status(400).json({ success: false, message: "HWID is required to ban a user." });
    }

    try {
        // 2. إضافة الـ HWID إلى قائمة المحظورين
        await db.collection("banned_users").doc(hwid).set({
            hwid: hwid,
            bannedAt: Date.now(),
            reason: "Banned by Admin from Dashboard"
        });

        // 3. البحث عن أي مفاتيح نشطة لهذا الـ HWID وحذفها (لكي يتم طرده فوراً)
        const activeKeysSnapshot = await db.collection("keys").where("hwid", "==", hwid).get();
        
        if (!activeKeysSnapshot.empty) {
            const batch = db.batch();
            activeKeysSnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit(); // تنفيذ حذف كل مفاتيحه دفعة واحدة
        }

        return res.status(200).json({ 
            success: true, 
            message: "User banned and their active keys deleted successfully." 
        });

    } catch (error) {
        console.error("Error banning user:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
}
