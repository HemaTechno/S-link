import db from "./firebase.js";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";

const LINKVERTISE_USER_ID = "1322389";
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1531313153600651375/56Hi7LrQ1gcsPad26A4PVCRJQpQ-al62TUB7L0ATwEANZvvPjUYMzzKN99DFx1seNm1W";

const JWT_SECRET = process.env.JWT_SECRET || "SubX_Ultra_Secret_Key_2026_!@#"; 

// 🔴 ضع مفاتيح جوجل كابتشا الخاصة بك هنا
const RECAPTCHA_SITE_KEY = process.env.RECAPTCHA_SITE_KEY || "6Lc31mwtAAAAAAWFkXp0_d1132x_fP2GnuorVPs0";
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || "6Lc31mwtAAAAALgsx7eKJwIIK-2uJkCp7-ERc__1";

// ==========================================
// واجهات المستخدم
// ==========================================
const invalidLinkUI = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invalid Link ❌</title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --bg-dark: #07090f; --glass-bg: rgba(18, 20, 28, 0.75); --text-main: #ffffff; }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
        body { background-color: var(--bg-dark); display: flex; justify-content: center; align-items: center; min-height: 100vh; color: var(--text-main); padding: 20px; }
        .container { width: 460px; max-width: 100%; padding: 40px 35px; border-radius: 28px; background: var(--glass-bg); backdrop-filter: blur(25px); border: 1px solid rgba(248, 113, 113, 0.4); text-align: center; box-shadow: 0 30px 60px rgba(0,0,0,0.7); }
        h1 { color: #f87171; margin-bottom: 15px; font-size: 1.6rem; font-weight: 800; }
        p { color: #aaa; font-size: 14px; margin-bottom: 20px; line-height: 1.6; }
        .error-icon { font-size: 60px; color: #f87171; margin-bottom: 20px; text-shadow: 0 0 20px rgba(248, 113, 113, 0.4); }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <h1>Invalid Request!</h1>
        <p>Your Device HWID is missing. You cannot bypass the system or generate a key directly from the browser.</p>
        <p style="color:#fff; font-weight:bold;">Please execute the script in Roblox to get your valid key link.</p>
    </div>
</body>
</html>
`;

const vpnBlockUI = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VPN Detected 🛡️</title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --bg-dark: #07090f; --glass-bg: rgba(18, 20, 28, 0.75); --text-main: #ffffff; }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
        body { background-color: var(--bg-dark); display: flex; justify-content: center; align-items: center; min-height: 100vh; color: var(--text-main); padding: 20px; }
        .container { width: 460px; max-width: 100%; padding: 40px 35px; border-radius: 28px; background: var(--glass-bg); backdrop-filter: blur(25px); border: 1px solid rgba(255, 165, 0, 0.4); text-align: center; box-shadow: 0 30px 60px rgba(0,0,0,0.7); }
        h1 { color: #ffa500; margin-bottom: 15px; font-size: 1.6rem; font-weight: 800; }
        p { color: #aaa; font-size: 14px; margin-bottom: 20px; line-height: 1.6; }
        .error-icon { font-size: 60px; color: #ffa500; margin-bottom: 20px; text-shadow: 0 0 20px rgba(255, 165, 0, 0.4); }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon"><i class="fa-solid fa-shield-halved"></i></div>
        <h1>VPN / Proxy Detected!</h1>
        <p>We detected that you are using a VPN or Proxy connection.</p>
        <p style="color:#fff; font-weight:bold;">Please turn off your VPN and refresh the page to continue.</p>
    </div>
</body>
</html>
`;

const tokenErrorUI = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invalid or Expired Link ⚠️</title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --bg-dark: #07090f; --glass-bg: rgba(18, 20, 28, 0.75); --text-main: #ffffff; }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
        body { background-color: var(--bg-dark); display: flex; justify-content: center; align-items: center; min-height: 100vh; color: var(--text-main); padding: 20px; }
        .container { width: 460px; max-width: 100%; padding: 40px 35px; border-radius: 28px; background: var(--glass-bg); backdrop-filter: blur(25px); border: 1px solid rgba(248, 113, 113, 0.4); text-align: center; box-shadow: 0 30px 60px rgba(0,0,0,0.7); }
        h1 { color: #f87171; margin-bottom: 15px; font-size: 1.6rem; font-weight: 800; }
        p { color: #aaa; font-size: 14px; margin-bottom: 20px; line-height: 1.6; }
        .error-icon { font-size: 60px; color: #f87171; margin-bottom: 20px; }
        .btn { display: inline-block; padding: 12px 25px; background: #4ade80; color: #000; text-decoration: none; font-weight: bold; border-radius: 10px; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon"><i class="fa-solid fa-clock-rotate-left"></i></div>
        <h1>Link Expired or Bypassed!</h1>
        <p>The link you used has either expired (took more than 15 minutes) or is invalid due to bypassing attempts.</p>
        <a href="/api/keysystem" class="btn">Return to Checkpoints</a>
    </div>
</body>
</html>
`;

const verifyingTaskUI = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verifying Task ⏳</title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --bg-dark: #07090f; --glass-bg: rgba(18, 20, 28, 0.75); --text-main: #ffffff; }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
        body { background-color: var(--bg-dark); display: flex; justify-content: center; align-items: center; min-height: 100vh; color: var(--text-main); padding: 20px; }
        .container { width: 460px; max-width: 100%; padding: 40px 35px; border-radius: 28px; background: var(--glass-bg); backdrop-filter: blur(25px); border: 1px solid rgba(74, 222, 128, 0.3); text-align: center; box-shadow: 0 30px 60px rgba(0,0,0,0.7); }
        h1 { color: #4ade80; margin-bottom: 15px; font-size: 1.5rem; font-weight: 800; }
        p { color: #aaa; font-size: 14px; margin-bottom: 20px; line-height: 1.6; }
        .spinner-icon { font-size: 50px; color: #4ade80; margin-bottom: 20px; }
        #countdown { font-size: 20px; font-weight: bold; color: #ffd700; }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner-icon"><i class="fa-solid fa-circle-notch fa-spin"></i></div>
        <h1>Verifying Task...</h1>
        <p>Please wait <span id="countdown">5</span> seconds while we confirm your task completion.</p>
    </div>
    <script>
        let count = 5;
        const timer = setInterval(() => {
            count--;
            document.getElementById('countdown').innerText = count;
            if(count <= 0) {
                clearInterval(timer);
                window.location.replace('/api/keysystem');
            }
        }, 1000);
    </script>
</body>
</html>
`;

const bannedUserUI = (hwid) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Banned 🚫</title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --bg-dark: #07090f; --glass-bg: rgba(18, 20, 28, 0.75); --text-main: #ffffff; }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
        body { background-color: var(--bg-dark); display: flex; justify-content: center; align-items: center; min-height: 100vh; color: var(--text-main); padding: 20px; }
        .container { width: 460px; max-width: 100%; padding: 40px 35px; border-radius: 28px; background: var(--glass-bg); backdrop-filter: blur(25px); border: 1px solid rgba(248, 113, 113, 0.5); text-align: center; box-shadow: 0 30px 60px rgba(0,0,0,0.7); }
        h1 { color: #f87171; margin-bottom: 15px; font-size: 1.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;}
        p { color: #aaa; font-size: 15px; margin-bottom: 20px; line-height: 1.6; }
        .error-icon { font-size: 70px; color: #f87171; margin-bottom: 20px; text-shadow: 0 0 25px rgba(248, 113, 113, 0.5); }
        .hwid-box { background: rgba(0,0,0,0.5); padding: 10px; border-radius: 10px; font-family: monospace; color: #f87171; border: 1px solid rgba(248, 113, 113, 0.2); }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon"><i class="fa-solid fa-ban"></i></div>
        <h1>Access Denied</h1>
        <p>Your Device HWID has been permanently <strong>BANNED</strong> from SubX Premium due to a violation of our terms.</p>
        <div class="hwid-box">HWID: ${hwid}</div>
    </div>
</body>
</html>
`;

const generateKeyUI = (keyStep, currentTaskUrl, activeKey, errorMessage) => {
    let actionHtml = '';
    let errorBox = errorMessage ? `<div class="error-box"><i class="fa-solid fa-triangle-exclamation"></i> ${errorMessage}</div>` : '';

    if (activeKey) {
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
        // 🟢 تضمين سكربت جوجل ريكابتشا ومربع التحقق هنا
        actionHtml = `
            <div class="steps-container">
                <div class="step done"><i class="fa-solid fa-check"></i> Checkpoint 1 Completed</div>
                <div class="step done"><i class="fa-solid fa-check"></i> Checkpoint 2 Completed</div>
                <div class="step done"><i class="fa-solid fa-check"></i> Checkpoint 3 Completed</div>
            </div>
            
            <div style="display: flex; justify-content: center; margin-bottom: 20px;">
                <div class="g-recaptcha" data-sitekey="${RECAPTCHA_SITE_KEY}" data-theme="dark"></div>
            </div>

            <button class="btn generate-btn" onclick="generateKey()">
                <i class="fa-solid fa-key"></i> Create Access Key
            </button>
        `;
    } else {
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
                <span><i class="fa-solid fa-link" style="color:#00e676; margin-right:6px;"></i> Continue with Linkvertise</span> 
                <i class="fa-solid fa-arrow-right"></i>
            </a>
            <p class="timer-text">Complete Linkvertise checkpoints to unlock your key.</p>
        `;
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <script src="https://beansnicerroller.com/1c/8c/07/1c8c07e41dacee6cc4a64a6f22c04a4b.js"></script>
    <script>(function(s){s.dataset.zone='11383401',s.src='https://al5sm.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>
    <!-- 🟢 مكتبة جوجل ريكابتشا الرسمية -->
    <script src="https://www.google.com/recaptcha/api.js" async defer></script>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SubX Key System 🔑</title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --primary: #4ade80; --bg-dark: #07090f; --glass-bg: rgba(18, 20, 28, 0.75); --glass-border: rgba(255, 215, 0, 0.15); --text-main: #ffffff; }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
        body { background-color: var(--bg-dark); display: flex; justify-content: center; align-items: center; min-height: 100vh; color: var(--text-main); padding: 20px; }
        .container { width: 460px; max-width: 100%; padding: 40px 35px; border-radius: 28px; background: var(--glass-bg); backdrop-filter: blur(25px); border: 1px solid var(--glass-border); text-align: center; box-shadow: 0 30px 60px rgba(0,0,0,0.7); }
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
        .generate-btn { background: linear-gradient(135deg, #4ade80 0%, #16a34a 100%); color: #000; justify-content: center; gap: 10px; }
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
            // التحقق من حل كابتشا جوجل
            const recaptchaResponse = grecaptcha.enterprise ? grecaptcha.enterprise.getResponse() : grecaptcha.getResponse();
            if (!recaptchaResponse || recaptchaResponse.length === 0) {
                alert("Please complete the Google reCAPTCHA verification!");
                return;
            }

            const btn = document.querySelector('.generate-btn');
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying Captcha...';
            btn.disabled = true;

            try {
                const response = await fetch('/api/keysystem', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        action: 'generate', 
                        recaptchaToken: recaptchaResponse // إرسال توكن الكابتشا للسيرفر
                    })
                });
                
                const data = await response.json();
                if(data.success) {
                    window.location.reload(); 
                } else {
                    alert(data.message);
                    btn.innerHTML = '<i class="fa-solid fa-key"></i> Create Access Key';
                    btn.disabled = false;
                    grecaptcha.reset(); // إعادة تعيين الكابتشا لو حدث خطأ
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

// ==========================================
// الكود الأساسي (الخادم)
// ==========================================
export default async function handler(req, res) {
    const clientIp = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket?.remoteAddress;
    let isVPN = false;
    
    if (clientIp && clientIp !== "::1" && clientIp !== "127.0.0.1") {
        try {
            const response = await fetch(`https://blackbox.ipinfo.app/lookup/${clientIp}`);
            const text = await response.text();
            if (text.trim() === 'Y') {
                isVPN = true;
            }
        } catch (error) {
            console.error("VPN check failed");
        }
    }

    if (isVPN) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.status(403).send(vpnBlockUI);
    }

    const cookieHeader = req.headers.cookie || '';
    
    let userHwid = req.query.hwid || null;
    if (!userHwid) {
        const hwidMatch = cookieHeader.match(/user_hwid=([^;]+)/);
        if (hwidMatch) userHwid = hwidMatch[1];
    }

    if (!userHwid) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.status(403).send(invalidLinkUI);
    }

    try {
        const banCheck = await db.collection("banned_users").doc(userHwid).get();
        if (banCheck.exists) {
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            return res.status(403).send(bannedUserUI(userHwid));
        }
    } catch (err) {
        console.error("Ban check failed:", err);
    }

    let keyStep = 0;
    const stepMatch = cookieHeader.match(/key_step=(\d+)/);
    if (stepMatch) keyStep = parseInt(stepMatch[1]);

    const keyMatch = cookieHeader.match(/active_key=([^;]+)/);
    let activeKey = keyMatch ? keyMatch[1] : null;
    let errorMessage = null;

    if (activeKey) {
        try {
            const keyDoc = await db.collection("keys").doc(activeKey).get();
            if (!keyDoc.exists) {
                activeKey = null;
                errorMessage = "Your key has expired or been deleted. Please get a new key!";
                res.setHeader('Set-Cookie', [
                    `active_key=; Max-Age=0; Path=/`,
                    `key_step=0; Max-Age=0; Path=/`,
                    `user_hwid=${userHwid}; Max-Age=86400; Path=/; SameSite=Lax`
                ]);
            }
        } catch (err) {
            console.error("Database check error:", err);
        }
    }

    if (req.method === "GET" && req.query.token) {
        try {
            const decoded = jwt.verify(req.query.token, JWT_SECRET);
            
            if (decoded.hwid === userHwid && decoded.targetStep === keyStep + 1 && decoded.targetStep <= 3) {
                keyStep = decoded.targetStep;
                
                res.setHeader('Set-Cookie', [
                    `key_step=${keyStep}; Max-Age=86400; Path=/; SameSite=Lax`,
                    `user_hwid=${userHwid}; Max-Age=86400; Path=/; SameSite=Lax`
                ]);
                res.setHeader("Content-Type", "text/html; charset=utf-8");
                return res.status(200).send(verifyingTaskUI);
            } else {
                res.setHeader("Content-Type", "text/html; charset=utf-8");
                return res.status(403).send(tokenErrorUI);
            }
        } catch (err) {
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            return res.status(403).send(tokenErrorUI);
        }
    }

    // 5. إنشاء المفتاح والتحقق من Google reCAPTCHA عبر سيرفر جوجل
    if (req.method === "POST" && req.body.action === "generate") {
        if (keyStep < 3) return res.status(403).json({ success: false, message: "You must complete all tasks first!" });

        const { recaptchaToken } = req.body;
        if (!recaptchaToken) {
            return res.status(400).json({ success: false, message: "Please complete the reCAPTCHA verification." });
        }

        // إرسال التوكن إلى سيرفر جوجل للتحقق من صحته
        try {
            const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`;
            const recaptchaRes = await fetch(verifyUrl, { method: "POST" });
            const recaptchaData = await recaptchaRes.json();

            if (!recaptchaData.success) {
                return res.status(400).json({ success: false, message: "reCAPTCHA verification failed. Please try again." });
            }
        } catch (err) {
            console.error("reCAPTCHA validation error:", err);
            return res.status(500).json({ success: false, message: "Captcha validation server error." });
        }

        const uniqueKey = "SUBX-" + nanoid(10).toUpperCase();
        const expiresAt = Date.now() + (24 * 60 * 60 * 1000); 

        try {
            await db.collection("keys").doc(uniqueKey).set({
                key: uniqueKey,
                createdAt: Date.now(),
                expiresAt: expiresAt,
                hwid: userHwid,
                ip: clientIp || "Unknown"
            });

            if (DISCORD_WEBHOOK_URL && DISCORD_WEBHOOK_URL.startsWith("http")) {
                try {
                    await fetch(DISCORD_WEBHOOK_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            embeds: [{
                                title: "🎉 New Key Generated (Google reCAPTCHA Verified)!",
                                color: 4906624, 
                                fields: [
                                    { name: "🔑 Key", value: `\`${uniqueKey}\``, inline: false },
                                    { name: "💻 HWID", value: `\`${userHwid}\``, inline: false },
                                    { name: "🌐 IP Address", value: `\`${clientIp || "Unknown"}\``, inline: false }
                                ],
                                footer: { text: "SubX Premium System" },
                                timestamp: new Date().toISOString()
                            }]
                        })
                    });
                } catch (webhookErr) {}
            }

            res.setHeader('Set-Cookie', [
                `key_step=0; Max-Age=0; Path=/`, 
                `active_key=${uniqueKey}; Max-Age=86400; Path=/; SameSite=Lax`,
                `user_hwid=${userHwid}; Max-Age=86400; Path=/; SameSite=Lax`
            ]);

    // ... existing code ...
            return res.status(200).json({ success: true, key: uniqueKey });
        } catch (err) {
            return res.status(500).json({ success: false, message: "Database Error" });
        }
    }

    // 6. عرض الصفحة الرئيسية
    if (req.method === "GET") {
        let currentTaskUrl = "#";
        if (keyStep < 3 && !activeKey) {
            const host = req.headers.host;
            const protocol = host.includes("localhost") ? "http" : "https";
            
            const sessionToken = jwt.sign(
                { hwid: userHwid, targetStep: keyStep + 1 }, 
                JWT_SECRET, 
                { expiresIn: '15m' } 
            );

            const targetUrl = `${protocol}://${host}/api/keysystem?token=${sessionToken}`;
            const base64Url = Buffer.from(targetUrl).toString('base64');
            const randomString = Math.random().toString(36).substring(7);
            currentTaskUrl = `https://link-to.net/${LINKVERTISE_USER_ID}/${randomString}/dynamic?r=${base64Url}`;
        }

        if (req.query.hwid && !cookieHeader.includes(`user_hwid=${req.query.hwid}`)) {
            let existingCookies = res.getHeader('Set-Cookie') || [];
            if (!Array.isArray(existingCookies)) existingCookies = [existingCookies];
            existingCookies.push(`user_hwid=${req.query.hwid}; Max-Age=86400; Path=/; SameSite=Lax`);
            res.setHeader('Set-Cookie', existingCookies);
        }

        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.status(200).send(generateKeyUI(keyStep, currentTaskUrl, activeKey, errorMessage));
    }

    return res.status(405).send("Method Not Allowed");
}
