import db from "./firebase.js";

// دالة لتصميم الصفحة النهائية وتمرير الرابط الأصلي بداخلها
const generateSuccessPage = (finalUrl) => `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تم التخطي بنجاح</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .card { background-color: white; padding: 40px 30px; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); text-align: center; max-width: 400px; width: 90%; }
        .success { color: #047857; background-color: #d1fae5; border: 1px solid #34d399; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-weight: bold; font-size: 20px; }
        .warning { color: #b91c1c; background-color: #fef2f2; border: 1px solid #f87171; padding: 15px; border-radius: 8px; margin-bottom: 25px; font-weight: bold; line-height: 1.5; }
        .btn { background-color: #10b981; color: white; padding: 14px 25px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; display: block; transition: background 0.3s; }
        .btn:hover { background-color: #059669; }
    </style>
</head>
<body>
    <div class="card">
        <div class="success">✅ تم التخطي بنجاح!</div>
        <div class="warning">⚠️ خلي بالك: الصفحة القادمة قد تفتح إعلانات منبثقة (Pop-up)، يرجى إغلاقها فور ظهورها للوصول لملفك بأمان.</div>
        <a href="${finalUrl}" class="btn">اضغط هنا للحصول على الرابط</a>
    </div>
</body>
</html>
`;

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).send("Method Not Allowed");
    }

    const { id } = req.query;

    if (!id) {
        return res.status(400).send("Missing Link ID");
    }

    try {
        const doc = await db.collection("links").doc(id).get();

        if (!doc.exists) {
            return res.status(404).send("الرابط غير موجود");
        }

        const data = doc.data();

        // 1. تحديث قاعدة البيانات لتسجيل أن المهمة اكتملت بنجاح لزيادة العداد
        await doc.ref.update({
            completedTasksCount: (data.completedTasksCount || 0) + 1,
            lastCompletedAt: Date.now()
        });

        // 2. إرسال صفحة الـ HTML بدلاً من التوجيه التلقائي
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.status(200).send(generateSuccessPage(data.url));

    } catch (err) {
        console.error("Error in completion handler:", err);
        // في حال حدوث خطأ، نعرض نفس الصفحة للمستخدم بدلاً من التوجيه المباشر للحفاظ على التجربة
        try {
            const doc = await db.collection("links").doc(id).get();
            if (doc.exists) {
                res.setHeader("Content-Type", "text/html; charset=utf-8");
                return res.status(200).send(generateSuccessPage(doc.data().url));
            }
        } catch {}
        
        return res.status(500).send("حدث خطأ أثناء معالجة طلب إكمال المهمة");
    }
}
