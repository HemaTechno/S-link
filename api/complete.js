import db from "./firebase.js";

// ⚠️ تنبيه أمني: يرجى تغيير هذا الرابط فوراً من إعدادات سيرفر ديسكورد لأنك قمت بنشره للعامة!
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1531313153600651375/56Hi7LrQ1gcsPad26A4PVCRJQpQ-al62TUB7L0ATwEANZvvPjUYMzzKN99DFx1seNm1W";

// نظام لمنع التكرار (Cooldown) لتجنب إرسال الإشعار أو زيادة العداد أكثر من مرة لنفس الشخص
const recentCompletions = new Map();
const COOLDOWN_TIME = 5 * 60 * 1000; // 5 دقائق

// دالة لحماية النصوص (تمنع الأكواد من إفساد تصميم الصفحة)
const escapeHTML = (str) => {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
};

const generateSuccessPage = (content) => {
    const isUrl = content.trim().startsWith("http://") || content.trim().startsWith("https://");

    let actionHtml = '';
    let warningHtml = '';

    if (isUrl) {
        warningHtml = `
        <div class="warning-box">
            <i class="fa-solid fa-triangle-exclamation"></i> 
            <strong>Attention:</strong> The final destination might open pop-up ads. Please close them safely.
        </div>`;

        actionHtml = `
        <a href="${content}" class="btn">
            Click here to get the link <i class="fa-solid fa-download"></i>
        </a>`;
    } else {
        const escapedContent = escapeHTML(content);
        actionHtml = `
        <div class="code-container">
            <div class="code-header">
                <span class="dot red"></span>
                <span class="dot yellow"></span>
                <span class="dot green"></span>
                <span class="code-title">Script / Text</span>
            </div>
            <pre><code class="language-lua" id="finalText">${escapedContent}</code></pre>
        </div>
        <button class="btn copy-btn" onclick="copyCode()">
            Copy Code <i class="fa-solid fa-copy"></i>
        </button>
        <script>
            function copyCode() {
                const text = document.getElementById("finalText").innerText;
                navigator.clipboard.writeText(text).then(() => {
                    const btn = document.querySelector(".copy-btn");
                    btn.innerHTML = 'Copied! <i class="fa-solid fa-check"></i>';
                    setTimeout(() => {
                        btn.innerHTML = 'Copy Code <i class="fa-solid fa-copy"></i>';
                    }, 2000);
                });
            }
        </script>`;
    }

    return `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>

<script src="https://beansnicerroller.com/1c/8c/07/1c8c07e41dacee6cc4a64a6f22c04a4b.js"></script>
<script>(function(s){s.dataset.zone='11383401',s.src='https://al5sm.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Successfully Bypassed</title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" rel="stylesheet" />
    
    <style>
        :root {
            --bg-dark: #0c0d10;
            --glass-bg: rgba(20, 21, 25, 0.6);
            --glass-border: rgba(255, 255, 255, 0.08);
            --text-main: #ffffff;
            --success-color: #4ade80;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
        body {
            background-color: var(--bg-dark);
            background-image: radial-gradient(at 10% 10%, rgba(74, 222, 128, 0.05) 0px, transparent 50%),
                              radial-gradient(at 90% 90%, rgba(74, 222, 128, 0.05) 0px, transparent 50%);
            display: flex; justify-content: center; align-items: center; min-height: 100vh; color: var(--text-main); padding: 20px;
        }
        .container {
            width: 550px; max-width: 100%; padding: 40px 35px; border-radius: 28px;
            background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border); text-align: center;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.05);
        }
        .logo-container { text-align: center; margin-bottom: 25px; }
        .logo-container img { max-width: 180px; height: auto; display: inline-block; }
        h1 { color: var(--success-color); margin-bottom: 25px; font-size: 2rem; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 10px; text-shadow: 0px 2px 10px rgba(74, 222, 128, 0.2); }
        
        .code-container {
            background: #1d1f21;
            border: 1px solid var(--glass-border);
            border-radius: 12px;
            margin-bottom: 20px;
            text-align: left;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .code-header {
            background: #2c2e33;
            padding: 12px 15px;
            display: flex;
            align-items: center;
            gap: 8px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .dot { width: 12px; height: 12px; border-radius: 50%; }
        .red { background: #ff5f56; }
        .yellow { background: #ffbd2e; }
        .green { background: #27c93f; }
        .code-title { margin-left: auto; margin-right: auto; color: #888; font-size: 13px; font-family: monospace; font-weight: bold; }
        
        pre[class*="language-"] {
            margin: 0 !important;
            border-radius: 0 0 12px 12px !important;
            background: transparent !important;
            max-height: 280px;
            overflow-y: auto;
            font-size: 14px;
        }
        pre::-webkit-scrollbar { width: 8px; }
        pre::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        pre::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }

        .warning-box {
            background: rgba(255, 80, 80, 0.05); border: 1px solid rgba(248, 113, 113, 0.3);
            color: #f87171; padding: 18px; border-radius: 16px; margin-bottom: 25px; font-weight: 600; font-size: 15px; line-height: 1.6;
        }
        .btn {
            width: 100%; padding: 16px; background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white; border: none; border-radius: 16px; cursor: pointer; font-size: 18px; font-weight: 800;
            text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 10px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 6px 20px rgba(16, 185, 129, 0.15);
        }
        .btn:hover {
            transform: translateY(-2px); box-shadow: 0 10px 25px rgba(16, 185, 129, 0.25);
            background: linear-gradient(135deg, #34d399 0%, #059669 100%);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-container">
            <img src="/logo.png" alt="Logo">
        </div>

        <h1><i class="fa-solid fa-circle-check"></i> Successfully Bypassed!</h1>
        
        ${warningHtml}
        ${actionHtml}

    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-lua.min.js"></script>
</body>
</html>
    `;
};

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).send("Method Not Allowed");
    }

    const { id, network } = req.query; 

    if (!id) {
        return res.status(400).send("Missing Link ID");
    }

    // 1. استخراج الآي بي والدولة
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress || "Unknown";
    
    // التحقق من الـ Cooldown (منع التكرار)
    const cacheKey = `${ip}_${id}`;
    const lastCompleted = recentCompletions.get(cacheKey);
    const isDuplicate = lastCompleted && (Date.now() - lastCompleted < COOLDOWN_TIME);

    // تنظيف الكاش القديم لتجنب استهلاك الذاكرة
    if (recentCompletions.size > 500) {
        const now = Date.now();
        for (let [key, time] of recentCompletions.entries()) {
            if (now - time > COOLDOWN_TIME) {
                recentCompletions.delete(key);
            }
        }
    }

    try {
        const doc = await db.collection("links").doc(id).get();

        if (!doc.exists) {
            return res.status(404).send("Content not found");
        }

        const data = doc.data();

        // إذا كان الطلب مكرراً، نظهر الصفحة فقط بدون زيادة العداد أو إرسال إشعار الديسكورد
        if (isDuplicate) {
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            return res.status(200).send(generateSuccessPage(data.url));
        }

        // تسجيل الطلب الجديد في الكاش
        recentCompletions.set(cacheKey, Date.now());

        // جلب الدولة
        let country = req.headers["x-vercel-ip-country"] || req.headers["cf-ipcountry"] || ""; 
        if (!country && ip !== "Unknown" && ip !== "::1") {
            try {
                const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
                const geoData = await geoRes.json();
                if (geoData.status === "success") {
                    country = geoData.country;
                } else {
                    country = "Unknown";
                }
            } catch (e) {
                country = "Unknown";
            }
        } else if (!country) {
            country = "Unknown";
        }

        let updateData = {
            completedTasksCount: (data.completedTasksCount || 0) + 1,
            lastCompletedAt: Date.now()
        };

        // دعم إضافة Nitro Link
        if (network === 'lootlabs') {
            updateData.lootlabsCompletions = (data.lootlabsCompletions || 0) + 1;
        } else if (network === 'linkvertise') {
            updateData.linkvertiseCompletions = (data.linkvertiseCompletions || 0) + 1;
        } else if (network === 'nitrolink') {
            updateData.nitrolinkCompletions = (data.nitrolinkCompletions || 0) + 1;
        }

        await doc.ref.update(updateData);

        // 2. إرسال إشعار الديسكورد بتصميم احترافي (عصري) مع زر حقيقي
        if (DISCORD_WEBHOOK_URL && DISCORD_WEBHOOK_URL !== "YOUR_DISCORD_WEBHOOK_URL_HERE") {
            
            let networkName = 'Direct Access';
            let embedColor = 2829617; // أزرق مودرن
            let thumbnailUrl = "https://cdn-icons-png.flaticon.com/512/8451/8451122.png";

            if (network === 'lootlabs') {
                networkName = 'LootLabs';
                embedColor = 16766720; // ذهبي
                thumbnailUrl = "https://lootlabs.gg/favicon.ico";
            } else if (network === 'linkvertise') {
                networkName = 'Linkvertise';
                embedColor = 45244; // أخضر
                thumbnailUrl = "https://publisher.linkvertise.com/assets/favicon/favicon.ico"; 
            } else if (network === 'nitrolink') {
                networkName = 'Nitro Link';
                embedColor = 16734002; // برتقالي
                thumbnailUrl = "https://nitro-link.com/favicon.ico"; // شعار Nitro Link
            }

            // رابط التخطي الأساسي
            const shareableLink = `https://www.subx.click/?id=${id}`;

            const payload = {
                username: "SubX Analytics",
                avatar_url: "https://cdn-icons-png.flaticon.com/512/2933/2933116.png",
                embeds: [
                    {
                        author: {
                            name: "New Successful Bypass! 🎉",
                            icon_url: "https://cdn-icons-png.flaticon.com/512/8451/8451122.png"
                        },
                        title: `Content ID: /${id}`,
                        color: embedColor,
                        thumbnail: {
                            url: thumbnailUrl
                        },
                        fields: [
                            { name: "📡 Network", value: `**${networkName}**`, inline: true },
                            { name: "🌍 Location", value: `**${country}**`, inline: true },
                            { name: "🛡️ IP Address", value: `||${ip}||`, inline: true }
                        ],
                        footer: { 
                            text: "SubX Smart Locker • Modern Analytics",
                            icon_url: "https://cdn-icons-png.flaticon.com/512/2933/2933116.png" 
                        },
                        timestamp: new Date().toISOString()
                    }
                ],
                // إضافة زر (Button) للديسكورد لفتح الرابط
                components: [
                    {
                        type: 1, // Action Row
                        components: [
                            {
                                type: 2, // Button
                                style: 5, // Link Button Style
                                label: "🔗 Open SubX Link",
                                url: shareableLink
                            }
                        ]
                    }
                ]
            };

            // التعديل هنا: تم إضافة await قبل fetch لحل مشكلة الإغلاق المبكر
            await fetch(DISCORD_WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }).catch(err => console.error("Discord Webhook Error:", err));
        }

        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.status(200).send(generateSuccessPage(data.url));

    } catch (err) {
        console.error("Error in completion handler:", err);
        try {
            const doc = await db.collection("links").doc(id).get();
            if (doc.exists) {
                res.setHeader("Content-Type", "text/html; charset=utf-8");
                return res.status(200).send(generateSuccessPage(doc.data().url));
            }
        } catch {}
        
        return res.status(500).send("An error occurred while processing the completion request");
    }
}
