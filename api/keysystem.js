import db from "./firebase.js";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";

const LINKJUST_API_TOKEN = "944c5ea148b949eb99be07963d8615e6904f460b";
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1531313153600651375/56Hi7LrQ1gcsPad26A4PVCRJQpQ-al62TUB7L0ATwEANZvvPjUYMzzKN99DFx1seNm1W";

const JWT_SECRET = process.env.JWT_SECRET || "SubX_Ultra_Secret_Key_2026_!@#"; 

// 🔴 إعدادات ديسكورد
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "1532480930625884240";
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "fJ2SyQX5I_DY2IHUzn8EYnw6Pm6YFHAB"; 
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || ""; // توكن البوت ضروري لفحص الرتبة
const DISCORD_SERVER_ID = process.env.DISCORD_SERVER_ID || "1135848445471629393";
const DISCORD_INVITE_URL = process.env.DISCORD_INVITE_URL || "https://discord.gg/hematech-1135848445471629393"; // ضع رابط الدعوة لسيرفرك هنا
const REQUIRED_ROLE_ID = process.env.REQUIRED_ROLE_ID || "1271181175305797652"; // 🔴 ضع ID الرتبة المطلوبة هنا

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
        :root { --bg-dark: #07090f; --glass-bg: rgba(18, 20, 28, 0.85); --text-main: #ffffff; }
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
        :root { --bg-dark: #07090f; --glass-bg: rgba(18, 20, 28, 0.85); --text-main: #ffffff; }
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

// 🟢 تعديل واجهة ديسكورد لتحتوي على زرين: الانضمام للسيرفر + التحقق من الرتبة
const discordAuthUI = (discordAuthUrl) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Discord Verification Required 🛡️</title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --bg-dark: #07090f; --glass-bg: rgba(18, 20, 28, 0.85); --text-main: #ffffff; }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
        body { background-color: var(--bg-dark); display: flex; justify-content: center; align-items: center; min-height: 100vh; color: var(--text-main); padding: 20px; }
        .container { width: 460px; max-width: 100%; padding: 40px 35px; border-radius: 28px; background: var(--glass-bg); backdrop-filter: blur(25px); border: 1px solid rgba(88, 101, 242, 0.4); text-align: center; box-shadow: 0 30px 60px rgba(0,0,0,0.7); }
        h1 { color: #5865F2; margin-bottom: 15px; font-size: 1.6rem; font-weight: 800; }
        p { color: #aaa; font-size: 14px; margin-bottom: 25px; line-height: 1.6; }
        .discord-icon { font-size: 65px; color: #5865F2; margin-bottom: 20px; text-shadow: 0 0 20px rgba(88, 101, 242, 0.4); }
        .btn-group { display: flex; flex-direction: column; gap: 12px; }
        .btn-discord { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 16px; background: #5865F2; color: #fff; text-decoration: none; font-weight: bold; border-radius: 14px; transition: 0.3s; font-size: 15px; box-shadow: 0 4px 15px rgba(88,101,242,0.3); }
        .btn-discord:hover { background: #4752c4; transform: translateY(-2px); }
        .btn-join { background: #23272A; border: 1px solid rgba(255,255,255,0.1); }
        .btn-join:hover { background: #2c2f33; }
    </style>
</head>
<body>
    <div class="container">
        <div class="discord-icon"><i class="fa-brands fa-discord"></i></div>
        <h1>Discord Verification</h1>
        <p>You must join our server, obtain the required role, and verify your account to continue.</p>
        <div class="btn-group">
            <a href="${DISCORD_INVITE_URL}" target="_blank" class="btn-discord btn-join">
                <i class="fa-solid fa-right-to-bracket"></i> 1. Join Discord Server
            </a>
            <a href="${discordAuthUrl}" class="btn-discord">
                <i class="fa-solid fa-user-check"></i> 2. Verify Role & Link Account
            </a>
        </div>
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
        :root { --bg-dark: #07090f; --glass-bg: rgba(18, 20, 28, 0.85); --text-main: #ffffff; }
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
        :root { --bg-dark: #07090f; --glass-bg: rgba(18, 20, 28, 0.85); --text-main: #ffffff; }
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
        :root { --bg-dark: #07090f; --glass-bg: rgba(18, 20, 28, 0.85); --text-main: #ffffff; }
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

// واجهة المستخدم لتوليد المفتاح مع نظام LinkJust المزدوج
const generateKeyUI = (keyStep, currentTaskUrl, activeKey, expiresAt, streakCount, errorMessage, requiresClientApi = false, targetUrl = "") => {
    let actionHtml = '';
    let errorBox = errorMessage ? `<div class="error-box"><i class="fa-solid fa-triangle-exclamation"></i> ${errorMessage}</div>` : '';

    if (activeKey) {
        actionHtml = `
            <div class="success-box">
                <i class="fa-solid fa-circle-check"></i> Your Key is Active! (${streakCount} Day(s) Streak 🔥)
            </div>
            <div class="key-display">
                <input type="text" id="finalKey" value="${activeKey}" readonly>
                <button onclick="copyKey()"><i class="fa-solid fa-copy"></i></button>
            </div>
            <div class="countdown-box">
                <i class="fa-solid fa-hourglass-half"></i> Time Remaining: <span id="liveTimer" style="color: #ffd700; font-weight: bold;">Calculated...</span>
            </div>
        `;
    } else if (keyStep >= 1) {
        let streakBonusText = streakCount === 6 
            ? `<div class="streak-badge" style="color: #ffd700;"><i class="fa-solid fa-fire"></i> This is your 7th Day! You will get a FREE 3-Day Key!</div>` 
            : `<div class="streak-badge"><i class="fa-solid fa-fire" style="color: #f97316;"></i> Current Streak: ${streakCount + 1}/7 Days</div>`;

        actionHtml = `
            <div class="steps-container">
                <div class="step done"><i class="fa-solid fa-check"></i> Task Completed</div>
            </div>
            
            ${streakBonusText}

            <div style="display: flex; justify-content: center; margin-bottom: 20px;">
                <div class="g-recaptcha" data-sitekey="${RECAPTCHA_SITE_KEY}" data-theme="dark"></div>
            </div>

            <button class="btn generate-btn" onclick="generateKey()">
                <i class="fa-solid fa-key"></i> Create Access Key
            </button>
        `;
    } else {
        let taskButton = '';
        
        if (requiresClientApi) {
            taskButton = `
            <a href="javascript:void(0)" onclick="generateLinkClientSide()" class="btn continue-btn" id="taskBtn">
                <span><i class="fa-solid fa-rocket" style="color:#ff5722; margin-right:8px;"></i> Click to Complete Task</span> 
                <i class="fa-solid fa-arrow-right"></i>
            </a>
            <script>
                async function generateLinkClientSide() {
                    const btn = document.getElementById('taskBtn');
                    btn.innerHTML = '<span><i class="fa-solid fa-spinner fa-spin"></i> Loading Secure Link...</span>';
                    btn.style.pointerEvents = 'none';

                    const target = "${targetUrl}";
                    const apiUrl = "https://linkjust.com/api?api=${LINKJUST_API_TOKEN}&url=" + encodeURIComponent(target);
                    
                    try {
                        const res = await fetch(apiUrl);
                        const data = await res.json();
                        if(data.status === 'success' && data.shortenedUrl) {
                            window.location.href = data.shortenedUrl;
                            return;
                        }
                    } catch(err) {
                        console.error("Browser API blocked, routing direct to target", err);
                    }
                    window.location.href = target;
                }
            </script>
            `;
        } else {
            taskButton = `
            <a href="${currentTaskUrl}" class="btn continue-btn">
                <span><i class="fa-solid fa-rocket" style="color:#ff5722; margin-right:8px;"></i> Click to Complete Task</span> 
                <i class="fa-solid fa-arrow-right"></i>
            </a>
            `;
        }

        actionHtml = `
            <div class="steps-container">
                <div class="step active"><i class="fa-solid fa-spinner fa-spin"></i> Required Task</div>
            </div>
            ${taskButton}
            <p class="timer-text"><i class="fa-solid fa-fire" style="color:#f97316;"></i> Streak Progress: ${streakCount}/7 Days (Keep it up!)</p>
        `;
    }

    let countdownScript = '';
    if (activeKey && expiresAt) {
        countdownScript = `
            <script>
                const expiresAt = ${expiresAt};
                function updateTimer() {
                    const now = new Date().getTime();
                    const distance = expiresAt - now;

                    if (distance < 0) {
                        document.getElementById("liveTimer").innerHTML = "EXPIRED";
                        return;
                    }

                    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                    document.getElementById("liveTimer").innerHTML = 
                        (hours < 10 ? "0" + hours : hours) + "h " + 
                        (minutes < 10 ? "0" + minutes : minutes) + "m " + 
                        (seconds < 10 ? "0" + seconds : seconds) + "s";
                }
                setInterval(updateTimer, 1000);
                updateTimer();
            </script>
        `;
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <script src="https://beansnicerroller.com/1c/8c/07/1c8c07e41dacee6cc4a64a6f22c04a4b.js"></script>
    <script>(function(s){s.dataset.zone='11383401',s.src='https://al5sm.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>
    <script src="https://www.google.com/recaptcha/api.js" async defer></script>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SubX Key System 🔑</title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --primary: #4ade80; --bg-dark: #07090f; --glass-bg: rgba(18, 20, 28, 0.85); --glass-border: rgba(255, 215, 0, 0.15); --text-main: #ffffff; }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
        body { background-color: var(--bg-dark); display: flex; justify-content: center; align-items: center; min-height: 100vh; color: var(--text-main); padding: 20px; }
        .container { width: 460px; max-width: 100%; padding: 40px 35px; border-radius: 28px; background: var(--glass-bg); backdrop-filter: blur(25px); border: 1px solid var(--glass-border); text-align: center; box-shadow: 0 30px 60px rgba(0,0,0,0.7); }
        .logo-container img { max-width: 140px; margin-bottom: 20px; filter: drop-shadow(0 0 12px rgba(255,215,0,0.25)); }
        h1 { color: #fff; margin-bottom: 20px; font-size: 1.6rem; font-weight: 800; }
        
        .steps-container { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; text-align: left; }
        .step { padding: 15px 18px; border-radius: 14px; font-weight: 700; display: flex; align-items: center; gap: 12px; font-size: 14px; transition: 0.3s; }
        .step.active { background: rgba(74, 222, 128, 0.08); border: 1px solid rgba(74, 222, 128, 0.3); color: #4ade80; box-shadow: 0 0 15px rgba(74, 222, 128, 0.08); }
        .step.done { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); color: #fff; }
        .step.done i { color: #4ade80; }

        .btn { width: 100%; padding: 16px; border-radius: 14px; cursor: pointer; font-size: 15px; font-weight: 800; text-decoration: none; display: flex; align-items: center; justify-content: space-between; border: none; transition: 0.3s; }
        .continue-btn { 
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); 
            color: #fff; 
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
            justify-content: center;
            gap: 10px;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.4); }
            70% { box-shadow: 0 0 0 15px rgba(255, 107, 107, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0); }
        }
        .continue-btn:hover { 
            transform: translateY(-3px) scale(1.02); 
            box-shadow: 0 8px 30px rgba(255, 107, 107, 0.5); 
            background: linear-gradient(135deg, #ff6b6b 0%, #d63031 100%);
        }
        .generate-btn { background: linear-gradient(135deg, #4ade80 0%, #16a34a 100%); color: #000; justify-content: center; gap: 10px; }
        .generate-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(74,222,128,0.35); }
        
        .timer-text { margin-top: 15px; font-size: 12px; color: #aaa; font-weight: 600; }
        .streak-badge { background: rgba(249, 115, 22, 0.1); border: 1px solid rgba(249, 115, 22, 0.3); color: #f97316; padding: 10px; border-radius: 10px; margin-bottom: 20px; font-size: 13px; font-weight: bold; }
        .countdown-box { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.08); padding: 12px; border-radius: 12px; font-size: 13px; color: #ccc; margin-bottom: 15px; }

        .key-display { display: flex; gap: 10px; margin-bottom: 12px; }
        .key-display input { flex: 1; padding: 14px; border-radius: 12px; background: rgba(0,0,0,0.6); border: 1px solid var(--primary); color: var(--primary); font-family: monospace; font-size: 15px; font-weight: bold; text-align: center; outline: none; }
        .key-display button { padding: 0 20px; border-radius: 12px; background: var(--primary); color: #000; border: none; cursor: pointer; font-size: 16px; transition: 0.3s; }
        .key-display button:hover { transform: scale(1.05); }
        
        .success-box { background: rgba(74, 222, 128, 0.1); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.2); padding: 12px; border-radius: 12px; margin-bottom: 15px; font-weight: bold; font-size: 13px; }
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
                        recaptchaToken: recaptchaResponse 
                    })
                });
                
                const data = await response.json();
                if(data.success) {
                    window.location.reload(); 
                } else {
                    alert(data.message);
                    btn.innerHTML = '<i class="fa-solid fa-key"></i> Create Access Key';
                    btn.disabled = false;
                    grecaptcha.reset();
                }
            } catch (err) {
                alert("Error generating key.");
                window.location.reload();
            }
        }
    </script>
    ${countdownScript}
</body>
</html>
    `;
};

// ==========================================
// الكود الأساسي والمنطق 
// ==========================================
export default async function handler(req, res) {
    const clientIp = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket?.remoteAddress;
    const userAgent = req.headers["user-agent"] || "Unknown Device";
    
    let isVPN = false;
    let countryName = "Unknown";
    
    if (clientIp && clientIp !== "::1" && clientIp !== "127.0.0.1") {
        try {
            const response = await fetch(`https://blackbox.ipinfo.app/lookup/${clientIp}`);
            const text = await response.text();
            if (text.trim() === 'Y') {
                isVPN = true;
            }

            const ipInfoRes = await fetch(`http://ip-api.com/json/${clientIp}`);
            const ipInfoData = await ipInfoRes.json();
            if (ipInfoData && ipInfoData.country) {
                countryName = ipInfoData.country;
            }
        } catch (error) {
            console.error("VPN or IP check failed");
        }
    }

    if (isVPN) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.status(403).send(vpnBlockUI);
    }

    const cookieHeader = req.headers.cookie || '';
    
    // التقاط الـ HWID 
    let userHwid = req.query.hwid || null;
    if (!userHwid) {
        const hwidMatch = cookieHeader.match(/user_hwid=([^;]+)/);
        if (hwidMatch) userHwid = hwidMatch[1];
    }

    // تحديد رابط العودة تلقائياً
    const host = req.headers.host;
    const protocol = req.headers["x-forwarded-proto"] || (host.includes("localhost") ? "http" : "https");
    const redirectUri = `${protocol}://${host}/api/keysystem`;

    // 🟢 استرجاع الـ HWID من الديسكورد عبر المتغير state عشان ميدخلش في لوب
    if (req.method === "GET" && req.query.code && req.query.state) {
        userHwid = req.query.state;
    }

    if (!userHwid) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.status(403).send(invalidLinkUI);
    }

    let cookieArray = [`user_hwid=${userHwid}; Max-Age=86400; Path=/; SameSite=Lax`];

    try {
        const banCheck = await db.collection("banned_users").doc(userHwid).get();
        if (banCheck.exists) {
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            return res.status(403).send(bannedUserUI(userHwid));
        }
    } catch (err) {
        console.error("Ban check failed:", err);
    }

    // ========================================================
    // 🟢 نظام ديسكورد للتحقق من العضوية والرتبة
    // ========================================================
    if (req.method === "GET" && req.query.code) {
        const code = req.query.code;
        try {
            const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    client_id: DISCORD_CLIENT_ID,
                    client_secret: DISCORD_CLIENT_SECRET,
                    grant_type: "authorization_code",
                    code: code,
                    redirect_uri: redirectUri
                })
            });
            const tokenData = await tokenRes.json();
            
            if (tokenData.access_token) {
                const userRes = await fetch("https://discord.com/api/users/@me", {
                    headers: { authorization: `Bearer ${tokenData.access_token}` }
                });
                const userData = await userRes.json();
                const discordUserId = userData.id;

                // التحقق من وجود العضو في السيرفر وتوفره على الرتبة المطلوبة
                let hasRole = false;
                let isMember = false;

                if (DISCORD_BOT_TOKEN) {
                    const memberRes = await fetch(`https://discord.com/api/guilds/${DISCORD_SERVER_ID}/members/${discordUserId}`, {
                        headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` }
                    });

                    if (memberRes.status === 200) {
                        isMember = true;
                        const memberData = await memberRes.json();
                        if (REQUIRED_ROLE_ID === "YOUR_ROLE_ID_HERE" || memberData.roles.includes(REQUIRED_ROLE_ID)) {
                            hasRole = true;
                        }
                    }
                }

                if (isMember && hasRole) {
                    await db.collection("discord_links").doc(userHwid).set({
                        discordId: discordUserId,
                        username: userData.username,
                        linkedAt: Date.now()
                    }, { merge: true });

                    cookieArray.push(`discord_verified=true; Max-Age=86400; Path=/; SameSite=Lax`);
                    res.setHeader('Set-Cookie', cookieArray);
                    
                    return res.redirect(302, `/api/keysystem?hwid=${userHwid}`);
                } else {
                    let failReason = !isMember ? "لم تنضم إلى سيرفر الديسكورد الخاص بنا بعد!" : "ليس لديك الرتبة المطلوبة في السيرفر!";
                    res.setHeader("Content-Type", "text/html; charset=utf-8");
                    return res.status(400).send(`
                        <!DOCTYPE html>
                        <html>
                        <head><meta charset="utf-8"><title>Discord Verification Failed</title></head>
                        <body style="background:#07090f; color:#fff; text-align:center; font-family:sans-serif; padding:50px;">
                            <h1 style="color:#f87171;">فشل التحقق من ديسكورد ❌</h1>
                            <p style="font-size:18px;">${failReason}</p>
                            <br>
                            <a href="${DISCORD_INVITE_URL}" target="_blank" style="color:#fff; background:#5865F2; padding:12px 25px; text-decoration:none; border-radius:10px; font-weight:bold; margin-right:10px;">انضم للسيرفر أولاً</a>
                            <a href="/api/keysystem?hwid=${userHwid}" style="color:#000; background:#4ade80; padding:12px 25px; text-decoration:none; border-radius:10px; font-weight:bold;">محاولة التحقق مجدداً</a>
                        </body>
                        </html>
                    `);
                }
            } else {
                res.setHeader("Content-Type", "text/html; charset=utf-8");
                return res.status(400).send(`
                    <!DOCTYPE html>
                    <html>
                    <head><meta charset="utf-8"><title>Discord Error</title></head>
                    <body style="background:#07090f; color:#fff; text-align:center; font-family:sans-serif; padding:50px;">
                        <h1 style="color:#f87171;">فشل التحقق من ديسكورد ❌</h1>
                        <p>ديسكورد رفض الطلب، راجع الخطأ ده:</p>
                        <div style="background:#111; padding:15px; border:1px solid #f87171; display:inline-block; margin:20px; border-radius:10px;">
                            <code>${tokenData.error_description || tokenData.error || JSON.stringify(tokenData)}</code>
                        </div>
                        <p>تأكد من <b>الـ Client Secret</b>، وتأكد إن رابط الـ Redirect مسجل في ديسكورد بشكل صحيح.</p>
                        <br>
                        <a href="/api/keysystem?hwid=${userHwid}" style="color:#000; background:#4ade80; padding:10px 20px; text-decoration:none; border-radius:10px; font-weight:bold;">العودة للمحاولة</a>
                    </body>
                    </html>
                `);
            }
        } catch (e) {
            console.error("Discord Auth Error:", e);
        }
    }

    // 🟢 الفحص الحي (Live Check) لخروج المستخدمين أو سحب الرتبة منهم
    let isDiscordVerified = false;
    const linkCheck = await db.collection("discord_links").doc(userHwid).get();
    
    if (linkCheck.exists) {
        const discordUserId = linkCheck.data().discordId;
        
        if (DISCORD_BOT_TOKEN && discordUserId) {
            try {
                const memberRes = await fetch(`https://discord.com/api/guilds/${DISCORD_SERVER_ID}/members/${discordUserId}`, {
                    headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` }
                });
                
                if (memberRes.status === 200) {
                    const memberData = await memberRes.json();
                    if (REQUIRED_ROLE_ID === "YOUR_ROLE_ID_HERE" || memberData.roles.includes(REQUIRED_ROLE_ID)) {
                        isDiscordVerified = true; 
                        cookieArray.push(`discord_verified=true; Max-Age=86400; Path=/; SameSite=Lax`);
                    } else {
                        console.log(`User ${discordUserId} lost the required role. Forcing re-verification.`);
                        await db.collection("discord_links").doc(userHwid).delete(); 
                        cookieArray.push(`discord_verified=; Max-Age=0; Path=/`);
                    }
                } else if (memberRes.status === 404) {
                    console.log(`User ${discordUserId} left the server. Forcing re-verification.`);
                    await db.collection("discord_links").doc(userHwid).delete(); 
                    cookieArray.push(`discord_verified=; Max-Age=0; Path=/`); 
                } else {
                    isDiscordVerified = true;
                }
            } catch (err) {
                console.error("Live Discord Check Failed:", err);
                isDiscordVerified = true; 
            }
        } else {
            isDiscordVerified = true;
            cookieArray.push(`discord_verified=true; Max-Age=86400; Path=/; SameSite=Lax`);
        }
    } else {
        cookieArray.push(`discord_verified=; Max-Age=0; Path=/`);
    }

    if (!isDiscordVerified && DISCORD_CLIENT_ID !== "YOUR_DISCORD_CLIENT_ID") {
        const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20guilds.join&state=${userHwid}`;
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader('Set-Cookie', cookieArray);
        return res.status(200).send(discordAuthUI(discordAuthUrl));
    }

    res.setHeader('Set-Cookie', cookieArray);
    // ========================================================

    let streakCount = 0;
    let lastKeyDate = 0;
    const streakDocRef = db.collection("user_streaks").doc(userHwid);
    try {
        const streakDoc = await streakDocRef.get();
        if (streakDoc.exists) {
            const data = streakDoc.data();
            streakCount = data.streakCount || 0;
            lastKeyDate = data.lastKeyDate || 0;
        }
    } catch (e) {
        console.error("Streak fetch error:", e);
    }

    let keyStep = 0;
    const stepMatch = cookieHeader.match(/key_step=(\d+)/);
    if (stepMatch) keyStep = parseInt(stepMatch[1]);

    const keyMatch = cookieHeader.match(/active_key=([^;]+)/);
    let activeKey = keyMatch ? keyMatch[1] : null;
    let activeKeyExpiresAt = null;
    let errorMessage = null;

    if (activeKey) {
        try {
            const keyDoc = await db.collection("keys").doc(activeKey).get();
            if (!keyDoc.exists) {
                activeKey = null;
                errorMessage = "Your key has expired or been deleted. Please generate a new key!";
                cookieArray.push(`active_key=; Max-Age=0; Path=/`);
                cookieArray.push(`key_step=0; Max-Age=0; Path=/`);
                res.setHeader('Set-Cookie', cookieArray);
            } else {
                const keyData = keyDoc.data();
                
                // 🟢 مسح المفتاح تلقائياً من قاعدة البيانات إذا انتهت صلاحيته
                if (keyData.expiresAt < Date.now()) {
                    await db.collection("keys").doc(activeKey).delete();
                    
                    activeKey = null;
                    errorMessage = "Your key has expired and was removed from our system. Please get a new key!";
                    
                    cookieArray.push(`active_key=; Max-Age=0; Path=/`);
                    cookieArray.push(`key_step=0; Max-Age=0; Path=/`);
                    res.setHeader('Set-Cookie', cookieArray);
                } else {
                    activeKeyExpiresAt = keyData.expiresAt;
                }
            }
        } catch (err) {
            console.error("Database check error:", err);
        }
    }

    if (req.method === "GET" && req.query.token) {
        try {
            const decoded = jwt.verify(req.query.token, JWT_SECRET);
            
            if (decoded.hwid === userHwid && decoded.targetStep === 1) {
                keyStep = 1;
                
                cookieArray.push(`key_step=${keyStep}; Max-Age=86400; Path=/; SameSite=Lax`);
                res.setHeader('Set-Cookie', cookieArray);
                
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

    if (req.method === "POST" && req.body.action === "generate") {
        if (keyStep < 1) return res.status(403).json({ success: false, message: "You must complete the task first!" });

        const { recaptchaToken } = req.body;
        if (!recaptchaToken) {
            return res.status(400).json({ success: false, message: "Please complete the reCAPTCHA verification." });
        }

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

        const nowTime = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        let newStreak = streakCount;

        if (lastKeyDate === 0) {
            newStreak = 1;
        } else {
            const diffDays = (nowTime - lastKeyDate) / oneDayMs;
            if (diffDays >= 1 && diffDays <= 2.5) {
                newStreak += 1;
            } else if (diffDays > 2.5) {
                newStreak = 1;
            }
        }

        let keyDuration = 24 * 60 * 60 * 1000;
        let isBonusKey = false;

        if (newStreak >= 7) {
            keyDuration = 3 * 24 * 60 * 60 * 1000;
            newStreak = 0;
            isBonusKey = true;
        }

        try {
            await streakDocRef.set({
                streakCount: newStreak,
                lastKeyDate: nowTime
            }, { merge: true });
        } catch (e) {}

        const uniqueKey = "SUBX-" + nanoid(10).toUpperCase();
        const expiresAt = nowTime + keyDuration; 

        try {
            const linkDoc = await db.collection("discord_links").doc(userHwid).get();
            const discordUsername = linkDoc.exists ? linkDoc.data().username : "Unknown";

            await db.collection("keys").doc(uniqueKey).set({
                key: uniqueKey,
                createdAt: nowTime,
                expiresAt: expiresAt,
                hwid: userHwid,
                ip: clientIp || "Unknown",
                country: countryName
            });

            if (DISCORD_WEBHOOK_URL && DISCORD_WEBHOOK_URL.startsWith("http")) {
                try {
                    await fetch(DISCORD_WEBHOOK_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            embeds: [{
                                title: isBonusKey ? "🎁 7-Day Streak Bonus! 3-Day Key Generated!" : "🎉 New Key Generated Successfully!",
                                color: isBonusKey ? 16766720 : 4906624, 
                                fields: [
                                    { name: "🔑 Generated Key", value: `\`${uniqueKey}\``, inline: false },
                                    { name: "💬 Discord User", value: `\`${discordUsername}\``, inline: true },
                                    { name: "🔥 Streak Status", value: isBonusKey ? "Completed 7 Days! (Rewarded 3 Days Free)" : `Day ${newStreak} of 7`, inline: true },
                                    { name: "🌍 Country", value: `\`${countryName}\``, inline: true },
                                    { name: "💻 HWID", value: `\`${userHwid}\``, inline: false },
                                    { name: "🌐 IP Address", value: `\`${clientIp || "Unknown"}\``, inline: true },
                                    { name: "📱 User Agent", value: `\`${userAgent.substring(0, 80)}...\``, inline: false }
                                ],
                                footer: { text: "SubX Advanced Logger" },
                                timestamp: new Date().toISOString()
                            }]
                        })
                    });
                } catch (webhookErr) {}
            }

            cookieArray.push(`key_step=0; Max-Age=0; Path=/`);
            cookieArray.push(`active_key=${uniqueKey}; Max-Age=86400; Path=/; SameSite=Lax`);
            res.setHeader('Set-Cookie', cookieArray);

            return res.status(200).json({ success: true, key: uniqueKey });
        } catch (err) {
            return res.status(500).json({ success: false, message: "Database Error" });
        }
    }

    if (req.method === "GET") {
        let currentTaskUrl = "#";
        let targetUrl = "";
        let requiresClientApi = false;

        if (keyStep < 1 && !activeKey) {
            const sessionToken = jwt.sign(
                { hwid: userHwid, targetStep: 1 }, 
                JWT_SECRET, 
                { expiresIn: '15m' } 
            );

            targetUrl = `${redirectUri}?token=${sessionToken}`;
            
            try {
                const linkJustApiUrl = `https://linkjust.com/api?api=${LINKJUST_API_TOKEN}&url=${encodeURIComponent(targetUrl)}`;
                const response = await fetch(linkJustApiUrl);
                const data = await response.json();
                
                if (data && data.status === 'success' && data.shortenedUrl) {
                    currentTaskUrl = data.shortenedUrl; 
                } else {
                    requiresClientApi = true; 
                }
            } catch (err) {
                console.error("LinkJust Server API Blocked:", err);
                requiresClientApi = true; 
            }
        }

        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.status(200).send(generateKeyUI(keyStep, currentTaskUrl, activeKey, activeKeyExpiresAt, streakCount, errorMessage, requiresClientApi, targetUrl));
    }

    return res.status(405).send("Method Not Allowed");
}
