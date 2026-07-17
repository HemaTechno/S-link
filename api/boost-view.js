import db from "./firebase.js";
import axios from "axios";

const LOOTLABS_API = "d2cc58f8084e256f9a15e41ab3971855c0289ed29a00dbf681e31b8b237ace81";
const cache = new Map();

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).send("Method Not Allowed");
    }

    const { id, step } = req.query;

    if (!id) return res.status(404).send("رابط غير صالح");

    try {
        const doc = await db.collection("boost_links").doc(id).get();
        if (!doc.exists) return res.status(404).send("الرابط غير موجود في نظام Boost");

        const data = doc.data();

        // ---------------------------------------------------
        // الحالة 1: صفحة التوجيه النهائي "جاري توجيهك..." بعد تخطي LootLabs
        // ---------------------------------------------------
        if (step === "redirect") {
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            return res.send(`
                <!DOCTYPE html>
                <html lang="ar" dir="rtl">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>جاري توجيهك...</title>
                    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet">
                    <style>
                        body {
                            background: #0d0e12;
                            color: #fff;
                            font-family: 'Tajawal', sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                        }
                        .card {
                            background: #16171e;
                            padding: 30px;
                            border: 1px solid #252733;
                            border-radius: 16px;
                            text-align: center;
                            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                            max-width: 400px;
                            width: 90%;
                        }
                        .loader {
                            border: 4px solid #252733;
                            border-top: 4px solid #3182ce;
                            border-radius: 50%;
                            width: 45px;
                            height: 45px;
                            animation: spin 1s linear infinite;
                            margin: 25px auto;
                        }
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h2>جاري توجيهك الآن...</h2>
                        <p style="color: #a0aec0;">لقد أتممت جميع المهام بنجاح! يتم الآن نقلك للرابط النهائي.</p>
                        <div class="loader"></div>
                    </div>
                    <script>
                        setTimeout(() => {
                            window.location.href = "${data.url}";
                        }, 2500); // الانتقال خلال ثانيتين ونصف
                    </script>
                </body>
                </html>
            `);
        }

        // ---------------------------------------------------
        // الحالة 2: طلب API داخلي لتوليد رابط LootLabs عند الضغط على زر التخطي
        // ---------------------------------------------------
        if (step === "get_lootlabs") {
            const cached = cache.get(id);
            if (cached && cached.expire > Date.now() && cached.url) {
                return res.status(200).json({ success: true, url: cached.url });
            }

            // الإشارة إلى مسار الـ API الحالي ليكون رابط الإكمال بعد تخطي LootLabs
            const completionUrl = `${req.headers.origin}/api/boost-view?id=${id}&step=redirect&tc=[tc]`;

            const response = await axios.post(
                "https://creators.lootlabs.gg/api/public/content_locker",
                {
                    title: `Boost_${id}`,
                    url: completionUrl,                  
                    tier_id: data.tier || 1,             
                    number_of_tasks: data.tasks || 3,    
                    theme: 1
                },
                {
                    headers: {
                        Authorization: `Bearer ${LOOTLABS_API}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            const messageData = Array.isArray(response.data?.message) ? response.data.message[0] : response.data?.message;
            const lootUrl = messageData?.loot_url || response.data?.loot_url;

            if (lootUrl) {
                cache.set(id, {
                    url: lootUrl,
                    expire: Date.now() + 60000
                });
                return res.status(200).json({ success: true, url: lootUrl });
            } else {
                return res.status(500).json({ success: false, message: "فشل إنشاء الرابط من طرف LootLabs" });
            }
        }

        // ---------------------------------------------------
        // الحالة 3: الواجهة الرئيسية لعرض مهام السوشيال ميديا (Boost Social UI)
        // ---------------------------------------------------
        const tasksArray = data.socialTasks || [];

        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.send(`
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Boost Social - نفذ المهام للوصول للرابط</title>
                <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet">
                <style>
                    body {
                        background: #0d0e12;
                        color: #e2e8f0;
                        font-family: 'Tajawal', sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        margin: 0;
                        padding: 20px;
                        box-sizing: border-box;
                    }
                    .container {
                        background: #16171e;
                        border: 1px solid #252733;
                        padding: 30px;
                        border-radius: 16px;
                        width: 100%;
                        max-width: 440px;
                        text-align: center;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.4);
                    }
                    h2 {
                        margin-top: 0;
                        font-size: 24px;
                        color: #fff;
                    }
                    p.subtitle {
                        color: #a0aec0;
                        font-size: 14px;
                        margin-bottom: 25px;
                    }
                    .task-card {
                        background: #1f202b;
                        border: 1px solid #2d303f;
                        padding: 15px 20px;
                        border-radius: 12px;
                        margin-bottom: 15px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        transition: border-color 0.2s;
                    }
                    .task-card:hover {
                        border-color: #4a5568;
                    }
                    .task-info {
                        text-align: right;
                    }
                    .task-title {
                        font-weight: bold;
                        font-size: 15px;
                        color: #fff;
                    }
                    .task-desc {
                        font-size: 12px;
                        color: #718096;
                        margin-top: 4px;
                    }
                    .btn-task {
                        background: #e53e3e;
                        color: white;
                        border: none;
                        padding: 10px 18px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 13px;
                        font-weight: bold;
                        text-decoration: none;
                        transition: background 0.2s;
                    }
                    .btn-task.completed {
                        background: #38a169 !important;
                    }
                    .btn-skip {
                        background: #2d3748;
                        color: #718096;
                        border: none;
                        width: 100%;
                        padding: 16px;
                        border-radius: 10px;
                        cursor: not-allowed;
                        font-size: 16px;
                        font-weight: bold;
                        margin-top: 20px;
                        transition: all 0.3s;
                    }
                    .btn-skip.ready {
                        background: #3182ce;
                        color: white;
                        cursor: pointer;
                        box-shadow: 0 4px 14px rgba(49, 130, 206, 0.4);
                    }
                    .btn-skip.ready:hover {
                        background: #2b6cb0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>نظام الدعم الإجتماعي - Boost Social</h2>
                    <p class="subtitle">قم بإنهاء المهام المطلوبة أدناه لتفعيل زر التخطي:</p>
                    
                    <div id="tasks-list">
                        ${tasksArray.map((task, index) => {
                            const isSub = task.type === "sub";
                            const taskTitle = isSub ? "إشتراك في القناة" : "لايك للفيديو";
                            const taskDesc = isSub ? "إشترك في قناتنا لتلقي كل جديد" : "ضع إعجابك على مقطع الفيديو";
                            const btnColor = isSub ? "#ff0000" : "#3182ce";
                            return `
                                <div class="task-card">
                                    <div class="task-info">
                                        <div class="task-title">${taskTitle}</div>
                                        <div class="task-desc">${taskDesc}</div>
                                    </div>
                                    <a href="${task.url}" target="_blank" onclick="completeTask(${index})" class="btn-task" style="background: ${btnColor}" id="btn-${index}">تنفيذ المهمة</a>
                                </div>
                            `;
                        }).join("")}
                    </div>

                    <button id="skip-btn" class="btn-skip" disabled>تخطي إلى الرابط</button>
                </div>

                <script>
                    const totalTasks = ${tasksArray.length};
                    const completedTasks = new Set();

                    function completeTask(index) {
                        const btn = document.getElementById('btn-' + index);
                        btn.innerText = "تم بنجاح ✓";
                        btn.classList.add('completed');
                        completedTasks.add(index);

                        if (completedTasks.size >= totalTasks) {
                            const skipBtn = document.getElementById('skip-btn');
                            skipBtn.removeAttribute('disabled');
                            skipBtn.classList.add('ready');
                        }
                    }

                    document.getElementById('skip-btn').addEventListener('click', async () => {
                        if (completedTasks.size < totalTasks) return;
                        
                        const skipBtn = document.getElementById('skip-btn');
                        skipBtn.innerText = "جاري التحضير والتوجيه...";
                        skipBtn.disabled = true;

                        try {
                            // التوجيه يشير الآن تلقائياً إلى الـ API بداخل مجلد الـ api
                            const res = await fetch(\`/api/boost-view?id=${id}&step=get_lootlabs\`);
                            const result = await res.json();
                            if (result.success && result.url) {
                                window.location.href = result.url;
                            } else {
                                alert("حدث خطأ: " + (result.message || "حاول مرة أخرى"));
                                skipBtn.innerText = "تخطي إلى الرابط";
                                skipBtn.disabled = false;
                            }
                        } catch (err) {
                            alert("خطأ في الشبكة، يرجى إعادة المحاولة.");
                            skipBtn.innerText = "تخطي إلى الرابط";
                            skipBtn.disabled = false;
                        }
                    });
                </script>
            </body>
            </html>
        `);

    } catch (err) {
        console.error(err);
        return res.status(500).send("حدث خطأ غير متوقع في خادم Boost Social.");
    }
}
