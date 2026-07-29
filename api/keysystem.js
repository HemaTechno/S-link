import db from "./firebase.js";
import { nanoid } from "nanoid";

const LINKVERTISE_USER_ID = "1322389"; // الـ ID الخاص بك في لينك فيرتيس

const generateKeyUI = (keyStep, currentTaskUrl, activeKey, errorMessage) => {
    let actionHtml = '';
    let errorBox = errorMessage ? `<div class="error-box"><i class="fa-solid fa-triangle-exclamation"></i> ${errorMessage}</div>` : '';

    if (activeKey) {
        // إذا كان يمتلك مفتاحاً نشطاً بالفعل
        actionHtml = `
            <div class="success-box">
                <i class="fa-solid fa-circle-check"></i> Your Key is Active!
            </div>
            <div class="key-display">
                <input type="text" id="finalKey" value="${activeKey}" readonly>
                <button onclick="copyKey()"><i class="fa-solid fa-copy"></i></button>
            </div>
            <p class="timer-text">Valid for 24 hours.</p>
        `;
    } else if (keyStep >= 3) {
        // إذا أنهى الـ 3 مهمات بنجاح
        actionHtml = `
            <div class="steps-container">
                <div class="step done"><i class="fa-solid fa-check"></i> Checkpoint 1 Completed</div>
                <div class="step done"><i class="fa-solid fa-check"></i> Checkpoint 2 Completed</div>
                <div class="step done"><i class="fa-solid fa-check"></i> Checkpoint 3 Completed</div>
            </div>
            <button class="btn generate-btn" onclick="generateKey()">
                <i class="fa-solid fa-key"></i> Create Access Key
            </button>
        `;
    } else {
        // إذا كان لا يزال في مرحلة التخطي
        const step1Class = keyStep > 0 ? 'done' : (keyStep === 0 ? 'active' : 'locked');
        const step2Class = keyStep > 1 ? 'done' : (keyStep === 1 ? 'active' : 'locked');
        const step3Class = keyStep > 2 ? 'done' : (keyStep === 2 ? 'active' : 'locked');

        const step1Icon = keyStep > 0 ? 'fa-check' : (keyStep === 0 ? 'fa-spinner fa-spin' : 'fa-lock');
        const step2Icon = keyStep > 1 ? 'fa-check' : (keyStep === 1 ? 'fa-spinner fa-spin' : 'fa-lock');
        const step3Icon = keyStep > 2 ? 'fa-check' : (keyStep === 2 ? 'fa-spinner fa-spin' : 'fa-lock');

        actionHtml = `
            <div class="steps-container">
                <div class="step ${step1Class}"><i class="fa-solid ${step1Icon}"></i> Checkpoint 1</div>
                <div class="step ${step2Class}"><i class="fa-solid ${step2Icon}"></i> Checkpoint 2</div>
                <div class="step ${step3Class}"><i class="fa-solid ${step3Icon}"></i> Checkpoint 3</div>
            </div>
            <a href="${currentTaskUrl}" class="btn continue-btn">
                <span><i class="fa-solid fa-link" style="color:#00e676; margin-right:6px;"></i> Continue to Step ${keyStep + 1}</span> 
                <i class="fa-solid fa-arrow-right"></i>
            </a>
            <p class="timer-text">Complete Linkvertise checkpoints to unlock your key.</p>
        `;
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SubX Key System 🔑</title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { 
            --primary: #4ade80; 
            --primary-glow: rgba(74, 222, 128, 0.2);
            --bg-dark: #07090f; 
            --glass-bg: rgba(18, 20, 28, 0.75); 
            --glass-border: rgba(255, 215, 0, 0.15);
            --text-main: #ffffff; 
        }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
        body { 
            background-color: var(--bg-dark); 
            background-image: radial-gradient(at 0% 0%, rgba(255, 215, 0, 0.05) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(74, 222, 128, 0.05) 0px, transparent 50%);
            display: flex; justify-content: center; align-items: center; min-height: 100vh; color: var(--text-main); padding: 20px; 
        }
        .container { 
            width: 460px; max-width: 100%; padding: 40px 35px; border-radius: 28px; 
            background: var(--glass-bg); backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px);
            border: 1px solid var(--glass-border); text-align: center; box-shadow: 0 30px 60px rgba(0,0,0,0.7); 
        }
        .logo-container img { max-width: 130px; margin-bottom: 15px; filter: drop-shadow(0 0 10px rgba(255,215,0,0.2)); }
        h1 { color: #fff; margin-bottom: 20px; font-size: 1.6rem; font-weight: 800; }
        
        .steps-container { display: flex; flex-direction: column; gap: 12px; margin-bottom: 25px; text-align: left; }
        .step { padding: 15px 18px; border-radius: 14px; font-weight: 700; display: flex; align-items: center; gap: 12px; font-size: 14px; transition: 0.3s; }
        .step.locked { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.04); color: #555; }
        .step.active { background: rgba(74, 222, 128, 0.08); border: 1px solid rgba(74, 222, 128, 0.3); color: #4ade80; box-shadow: 0 0 15px rgba(74, 222, 128, 0.08); }
        .step.done { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); color: #fff; }
        .step.done i { color: #4ade80; }

        .btn { width: 100%; padding: 16px; border-radius: 14px; cursor: pointer; font-size: 15px; font-weight: 800; text-decoration: none; display: flex; align-items: center; justify-content: space-between; border: none; transition: 0.3s; }
        .continue-btn { background: linear-gradient(135deg, #ffffff 0%, #e2e8f0); color: #000; box-shadow: 0 4px 15px rgba(255,255,255,0.1); }
        .continue-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(255,255,255,0.2); }
        
        .generate-btn { background: linear-gradient(135deg, #4ade80 0%, #16a34a 100%); color: #000; justify-content: center; gap: 10px; box-shadow: 0 4px 15px rgba(74,222,128,0.2); }
        .generate-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(74,222,128,0.35); }
        
        .timer-text { margin-top: 18px; font-size: 12px; color: #888; font-weight: 600; }

        .key-display { display: flex; gap: 10px; margin-bottom: 15px; }
        .key-display input { flex: 1; padding: 14px; border-radius: 12px; background: rgba(0,0,0,0.6); border: 1px solid var(--primary); color: var(--primary); font-family: monospace; font-size: 15px; font-weight: bold; text-align: center; outline: none; }
        .key-display button { padding: 0 20px; border-radius: 12px; background: var(--primary); color: #000; border: none; cursor: pointer; font-size: 16px; transition: 0.3s; }
        .key-display button:hover { transform: scale(1.05); }
        
        .success-box { background: rgba(74, 222, 128, 0.1); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.2); padding: 12px; border-radius: 12px; margin-bottom: 20px; font-weight: bold; font-size: 14px; }
        .error-box { background: rgba(248, 113, 113, 0.1); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.2); padding: 10px; border-radius: 10px; margin-bottom: 15px; font-size: 12px; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-container"><img src="/logo.png" alt="Logo"></div>
        <h1>Get Your Access Key</h1>
        ${errorBox}
        ${actionHtml}
    </div>

    <script>
        function copyKey() {
            const copyText = document.getElementById("finalKey");
            copyText.select();
            navigator.clipboard.writeText(copyText.value);
            alert("Key Copied to Clipboard!");
        }

        async function generateKey() {
            const btn = document.querySelector('.generate-btn');
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
            btn.disabled = true;

            try {
                const response = await fetch('/api/keysystem', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'generate' })
                });
                
                const data = await response.json();
                if(data.success) {
                    window.location.reload(); 
                } else {
                    alert(data.message);
                    btn.innerHTML = '<i class="fa-solid fa-key"></i> Create Access Key';
                    btn.disabled = false;
                }
            } catch (err) {
                alert("Error generating key.");
                window.location.reload();
            }
        }
    </script>
</body>
</html>
    `;
};

export default async function handler(req, res) {
    const cookieHeader = req.headers.cookie || '';
    
    // التقاط بصمة اللاعب من الرابط وحفظها في الكوكيز
    let userHwid = req.query.hwid || null;
    if (!userHwid) {
        const hwidMatch = cookieHeader.match(/user_hwid=([^;]+)/);
        if (hwidMatch) userHwid = hwidMatch[1];
    }

    let keyStep = 0;
    const stepMatch = cookieHeader.match(/key_step=(\d+)/);
    if (stepMatch) keyStep = parseInt(stepMatch[1]);

    const keyMatch = cookieHeader.match(/active_key=([^;]+)/);
    let activeKey = keyMatch ? keyMatch[1] : null;

    let errorMessage = null;

    // التحقق مما إذا كان المفتاح المحفوظ في الكوكيز لا يزال موجوداً في الداتا بيز (Firebase)
    if (activeKey) {
        try {
            const keyDoc = await db.collection("keys").doc(activeKey).get();
            if (!keyDoc.exists) {
                // لو المفتاح اتمسح من الداتا بيز، نقوم بإلغائه وإعلام المستخدم
                activeKey = null;
                errorMessage = "Your key has expired or been deleted from database. Please get a new key!";
                // مسح الكوكيز القديمة
                res.setHeader('Set-Cookie', [
                    `active_key=; Max-Age=0; Path=/`,
                    `key_step=0; Max-Age=0; Path=/`,
                    userHwid ? `user_hwid=${userHwid}; Max-Age=86400; Path=/; SameSite=Lax` : ''
                ].filter(Boolean));
            }
        } catch (err) {
            console.error("Database check error:", err);
        }
    }

    // معالجة عودة المستخدم من Linkvertise بعد تخطي الخطوة
    if (req.method === "GET" && req.query.complete_step) {
        const completedStep = parseInt(req.query.complete_step);
        if (completedStep === keyStep + 1 && completedStep <= 3) {
            keyStep = completedStep;
        }
        
        let cookies = [`key_step=${keyStep}; Max-Age=86400; Path=/; SameSite=Lax`];
        if (userHwid) cookies.push(`user_hwid=${userHwid}; Max-Age=86400; Path=/; SameSite=Lax`);
        
        res.setHeader('Set-Cookie', cookies);
        res.writeHead(302, { Location: '/api/keysystem' });
        return res.end();
    }

    // معالجة طلب إنشاء المفتاح بعد إنهاء المهام
    if (req.method === "POST" && req.body.action === "generate") {
        if (keyStep < 3) return res.status(403).json({ success: false, message: "You must complete all tasks first!" });

        const uniqueKey = "SUBX-" + nanoid(10).toUpperCase();
        const expiresAt = Date.now() + (24 * 60 * 60 * 1000);

        try {
            await db.collection("keys").doc(uniqueKey).set({
                key: uniqueKey,
                createdAt: Date.now(),
                expiresAt: expiresAt,
                hwid: userHwid || "Unknown_HWID",
                ip: req.headers["x-forwarded-for"]?.split(",")[0] || "Unknown"
            });

            res.setHeader('Set-Cookie', [
                `key_step=0; Max-Age=0; Path=/`, 
                `active_key=${uniqueKey}; Max-Age=86400; Path=/; SameSite=Lax`,
                userHwid ? `user_hwid=${userHwid}; Max-Age=86400; Path=/; SameSite=Lax` : ''
            ].filter(Boolean));

            return res.status(200).json({ success: true, key: uniqueKey });
        } catch (err) {
            return res.status(500).json({ success: false, message: "Database Error" });
        }
    }

    // عرض الصفحة الرئيسية للـ UI
    if (req.method === "GET") {
        let currentTaskUrl = "#";
        if (keyStep < 3 && !activeKey) {
            const host = req.headers.host;
            const protocol = host.includes("localhost") ? "http" : "https";
            const targetUrl = `${protocol}://${host}/api/keysystem?complete_step=${keyStep + 1}`;
            const base64Url = Buffer.from(targetUrl).toString('base64');
            const randomString = Math.random().toString(36).substring(7);
            currentTaskUrl = `https://link-to.net/${LINKVERTISE_USER_ID}/${randomString}/dynamic?r=${base64Url}`;
        }

        if (req.query.hwid && !cookieHeader.includes(`user_hwid=${req.query.hwid}`)) {
            let existingCookies = res.getHeader('Set-Cookie') || [];
            if (!Array.isArray(existingCookies)) existingCookies = [existingCookies];
            existingCookies.path = '/';
            existingCookies.push(`user_hwid=${req.query.hwid}; Max-Age=86400; Path=/; SameSite=Lax`);
            res.setHeader('Set-Cookie', existingCookies);
        }

        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.status(200).send(generateKeyUI(keyStep, currentTaskUrl, activeKey, errorMessage));
    }

    return res.status(405).send("Method Not Allowed");
}
