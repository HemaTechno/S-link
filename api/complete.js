import db from "./firebase.js";

// ⚠️ يرجى ضبط المفتاح من متغيرات البيئة بدلاً من كتابته صريحة
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "https://discord.com/api/webhooks/1531313153600651375/56Hi7LrQ1gcsPad26A4PVCRJQpQ-al62TUB7L0ATwEANZvvPjUYMzzKN99DFx1seNm1W";

// 🛡️ نظام حماية الامان: منع احتساب أكثر من 1 إكمال لكل IP لنفس الرابط خلال 24 ساعة
const recentCompletions = new Map();
const COOLDOWN_24H = 24 * 60 * 60 * 1000; // 24 ساعة بالمللي ثانية

// دالة لحماية النصوص من كسر الـ HTML
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
            <i class="fa-solid fa-circle-info"></i> 
            <strong>Attention:</strong> The destination link is unlocked! Click below to proceed.
        </div>`;

        actionHtml = `
        <a href="${content}" class="btn default-btn" onclick="playSound('click')">
            Get Final Link <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </a>`;
    } else {
        const escapedContent = escapeHTML(content);
        actionHtml = `
        <div class="code-container">
            <div class="code-header">
                <span class="dot red"></span>
                <span class="dot yellow"></span>
                <span class="dot green"></span>
                <span class="code-title">Script / Text Content</span>
            </div>
            <pre><code class="language-lua" id="finalText">${escapedContent}</code></pre>
        </div>
        <button class="btn default-btn copy-btn" onclick="copyCode()">
            Copy Script / Text <i class="fa-solid fa-copy"></i>
        </button>
        <script>
            function copyCode() {
                playSound('click');
                const text = document.getElementById("finalText").innerText;
                navigator.clipboard.writeText(text).then(() => {
                    playSound('success');
                    const btn = document.querySelector(".copy-btn");
                    btn.innerHTML = 'Copied! <i class="fa-solid fa-check"></i>';
                    setTimeout(() => {
                        btn.innerHTML = 'Copy Script / Text <i class="fa-solid fa-copy"></i>';
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
    <title>Successfully Unlocked</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Tajawal:wght@500;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" rel="stylesheet" />
    
    <style>
        :root {
            --bg-dark: #07090e;
            --card-bg: #121620;
            --theme-blue: #0087FC;
            --theme-blue-hover: #0072dc;
            --text-main: #ffffff;
            --text-sub: #8a94a6;
            --success: #10b981;
            --danger: #ef4444;
        }

        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
            font-family: 'Plus Jakarta Sans', 'Tajawal', -apple-system, BlinkMacSystemFont, sans-serif;
            -webkit-font-smoothing: antialiased;
        }

        body {
            background-color: var(--bg-dark);
            background-image: radial-gradient(rgba(0, 135, 252, 0.28) 1.6px, transparent 1.6px);
            background-size: 22px 22px;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 15px;
            color: var(--text-main);
        }

        .main-card {
            width: 420px;
            max-width: 100%;
            padding: 30px 24px;
            border-radius: 22px;
            background: var(--card-bg);
            border: 1px solid rgba(255, 255, 255, 0.07);
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            text-align: center;
        }

        .status-icon-wrap {
            width: 70px;
            height: 70px;
            margin: 0 auto 16px auto;
            border-radius: 50%;
            background: rgba(16, 185, 129, 0.12);
            border: 1px solid var(--success);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--success);
            font-size: 32px;
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
        }

        h1 {
            font-size: 1.55rem;
            font-weight: 800;
            color: #ffffff;
            margin-bottom: 8px;
            letter-spacing: -0.3px;
        }

        .sub-heading {
            color: var(--text-sub);
            font-size: 0.88rem;
            margin-bottom: 22px;
            font-weight: 500;
        }

        .code-container {
            background: #181d2a;
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 14px;
            margin-bottom: 18px;
            text-align: left;
            overflow: hidden;
        }

        .code-header {
            background: #1e2436;
            padding: 10px 14px;
            display: flex;
            align-items: center;
            gap: 6px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .red { background: #ff5f56; }
        .yellow { background: #ffbd2e; }
        .green { background: #27c93f; }
        .code-title { margin-left: auto; margin-right: auto; color: var(--text-sub); font-size: 11px; font-family: monospace; font-weight: 700; }

        pre[class*="language-"] {
            margin: 0 !important;
            border-radius: 0 0 14px 14px !important;
            background: transparent !important;
            max-height: 240px;
            overflow-y: auto;
            font-size: 13px;
        }

        .warning-box {
            background: rgba(0, 135, 252, 0.1); 
            border: 1px solid rgba(0, 135, 252, 0.3);
            color: #ffffff; 
            padding: 14px; 
            border-radius: 14px; 
            margin-bottom: 20px; 
            font-weight: 500; 
            font-size: 12.5px; 
            line-height: 1.45;
            text-align: left;
        }
        .warning-box i { color: var(--theme-blue); margin-right: 6px; }

        .btn {
            width: 100%; padding: 14px; border-radius: 14px; font-size: 14.5px; font-weight: 800;
            text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px;
            border: none; cursor: pointer; transition: all 0.25s ease;
        }
        .default-btn {
            color: #ffffff;
            background: var(--theme-blue);
            box-shadow: 0 6px 20px rgba(0, 135, 252, 0.35);
        }
        .default-btn:hover {
            background: var(--theme-blue-hover);
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0, 135, 252, 0.5);
        }

        /* Toast Notification */
        .toast-container {
            position: fixed; top: 18px; left: 50%; transform: translateX(-50%);
            z-index: 9999; display: flex; flex-direction: column; gap: 8px; pointer-events: none;
            width: 340px; max-width: 90%;
        }
        .toast {
            background: rgba(18, 22, 32, 0.95); 
            border: 1px solid rgba(0, 135, 252, 0.4); 
            border-left: 4px solid var(--theme-blue);
            color: #fff;
            padding: 12px 18px; 
            border-radius: 14px; 
            font-size: 12.5px; 
            font-weight: 700;
            display: flex; 
            align-items: center; 
            gap: 10px; 
            box-shadow: 0 12px 30px rgba(0,0,0,0.6);
            backdrop-filter: blur(12px);
            animation: toastIn 0.25s ease-out;
            direction: rtl;
        }
        @keyframes toastIn { from { opacity: 0; transform: translate(-50%, -15px); } to { opacity: 1; transform: translate(-50%, 0); } }

        .footer-brand {
            margin-top: 18px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10.5px;
            color: var(--text-sub);
            font-weight: 600;
        }
        .brand-highlight { color: var(--theme-blue); font-weight: 800; }
    </style>
</head>
<body>
    <div class="toast-container" id="toastBox"></div>

    <div class="main-card">
        <div class="status-icon-wrap">
            <i class="fa-solid fa-check"></i>
        </div>

        <h1>Content Unlocked!</h1>
        <p class="sub-heading">Your destination content is ready below</p>
        
        ${warningHtml}
        ${actionHtml}

        <div class="footer-brand">
            <span>Powered by</span>
            <span class="brand-highlight">SubX</span>
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-lua.min.js"></script>

    <script>
    (function(){
        let audioCtx = null;

        function initAudio() {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
        }

        window.playSound = function(type) {
            try {
                initAudio();
                if (!audioCtx) return;
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                const now = audioCtx.currentTime;

                if (type === 'click') {
                    osc.frequency.setValueAtTime(600, now);
                    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.07);
                    gain.gain.setValueAtTime(0.3, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);
                    osc.start(now);
                    osc.stop(now + 0.07);
                } else if (type === 'success') {
                    osc.frequency.setValueAtTime(520, now);
                    osc.frequency.setValueAtTime(740, now + 0.08);
                    osc.frequency.setValueAtTime(960, now + 0.16);
                    gain.gain.setValueAtTime(0.4, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                    osc.start(now);
                    osc.stop(now + 0.25);
                } else if (type === 'salawat') {
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(440, now);
                    osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
                    gain.gain.setValueAtTime(0.35, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
                    osc.start(now);
                    osc.stop(now + 0.35);
                }
            } catch(e) {}
        };

        function showToast(message) {
            const toastBox = document.getElementById('toastBox');
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.innerHTML = '<i class="fa-solid fa-kaaba" style="color:#0087FC; font-size:15px;"></i> ' + message;
            toastBox.appendChild(toast);

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.25s';
                setTimeout(() => toast.remove(), 250);
            }, 4000);
        }

        let salawatDone = false;
        function triggerSalawatOnFirstTouch() {
            if (salawatDone) return;
            salawatDone = true;
            playSound('salawat');
            showToast("✨ اللهم صلي وسلم على نبينا محمد ﷺ");
        }

        window.addEventListener('click', triggerSalawatOnFirstTouch, { once: true });
        window.addEventListener('touchstart', triggerSalawatOnFirstTouch, { once: true });
    })();
    </script>
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

    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress || "Unknown";
    
    // 🛡️ فحص التكرار خلال 24 ساعة لـ IP + Link ID
    const cacheKey = `${ip}_${id}`;
    const lastCompleted = recentCompletions.get(cacheKey);
    const isIpDuplicate = lastCompleted && (Date.now() - lastCompleted < COOLDOWN_24H);

    const cookieHeader = req.headers.cookie || '';
    const hasNitroCooldown = cookieHeader.includes('nitro_24h_cooldown=1');
    
    let isNitroBlocked = false;
    let shouldSetNitroCookie = false;

    if (network === 'nitrolink') {
        if (hasNitroCooldown) {
            isNitroBlocked = true;
        } else {
            shouldSetNitroCookie = true;
        }
    }

    const isDuplicate = isIpDuplicate || isNitroBlocked;

    // تنظيف كاش الإكمال القديم لمنع تضخم الذاكرة
    if (recentCompletions.size > 1000) {
        const now = Date.now();
        for (let [key, time] of recentCompletions.entries()) {
            if (now - time > COOLDOWN_24H) {
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
        const finalContent = data.targetUrl || data.url || "";

        // 🛑 إذا كان الطلب مكرراً خلال 24 ساعة، يتم عرض المحتوى للعميل دون احتساب الزيادة أو التحديث
        if (isDuplicate) {
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            return res.status(200).send(generateSuccessPage(finalContent));
        }

        // تسجيل العملية في الكاش لمنع التكرار لمدة 24 ساعة قادمة
        recentCompletions.set(cacheKey, Date.now());

        let country = req.headers["x-vercel-ip-country"] || req.headers["cf-ipcountry"] || ""; 
        if (!country && ip !== "Unknown" && ip !== "::1") {
            try {
                const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
                const geoData = await geoRes.json();
                country = geoData.status === "success" ? geoData.country : "Unknown";
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

        if (network === 'lootlabs') {
            updateData.lootlabsCompletions = (data.lootlabsCompletions || 0) + 1;
        } else if (network === 'linkvertise') {
            updateData.linkvertiseCompletions = (data.linkvertiseCompletions || 0) + 1;
        } else if (network === 'nitrolink') {
            updateData.nitrolinkCompletions = (data.nitrolinkCompletions || 0) + 1;
        } else if (network === 'just') {
            updateData.linkjustCompletions = (data.linkjustCompletions || 0) + 1;
        }

        await doc.ref.update(updateData);

        if (DISCORD_WEBHOOK_URL) {
            let networkName = 'Direct Access';
            let embedColor = 2829617; 
            let thumbnailUrl = "https://cdn-icons-png.flaticon.com/512/8451/8451122.png";

            if (network === 'lootlabs') {
                networkName = 'LootLabs';
                embedColor = 16766720;
                thumbnailUrl = "https://lootlabs.gg/favicon.ico";
            } else if (network === 'linkvertise') {
                networkName = 'Linkvertise';
                embedColor = 45244;
                thumbnailUrl = "https://i.ibb.co/YFSmFQTL/linkvertise.png"; 
            } else if (network === 'nitrolink') {
                networkName = 'Nitro Link';
                embedColor = 16734002;
                thumbnailUrl = "https://i.ibb.co/GQ22bMHN/nitrolink.png";
            } else if (network === 'just') {
                networkName = 'LinkJust';
                embedColor = 65535;
                thumbnailUrl = "https://cdn-icons-png.flaticon.com/512/2933/2933116.png";
            }

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
                        thumbnail: { url: thumbnailUrl },
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
                components: [
                    {
                        type: 1, 
                        components: [
                            {
                                type: 2, 
                                style: 5, 
                                label: "🔗 Open SubX Link",
                                url: shareableLink
                            }
                        ]
                    }
                ]
            };

            await fetch(DISCORD_WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }).catch(err => console.error("Discord Webhook Error:", err));
        }

        if (shouldSetNitroCookie) {
            res.setHeader("Set-Cookie", "nitro_24h_cooldown=1; Max-Age=86400; Path=/; SameSite=Lax");
        }

        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.status(200).send(generateSuccessPage(finalContent));

    } catch (err) {
        console.error("Error in completion handler:", err);
        try {
            const doc = await db.collection("links").doc(id).get();
            if (doc.exists) {
                const data = doc.data();
                res.setHeader("Content-Type", "text/html; charset=utf-8");
                return res.status(200).send(generateSuccessPage(data.targetUrl || data.url || ""));
            }
        } catch {}
        
        return res.status(500).send("An error occurred while processing the completion request");
    }
}
