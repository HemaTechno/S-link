import db from "./firebase.js";
import { nanoid } from "nanoid";
import axios from "axios";

const LOOTLABS_API = "d2cc58f8084e256f9a15e41ab3971855c0289ed29a00dbf681e31b8b237ace81";
const LINKVERTISE_USER_ID = "1322389";
const NITRO_LINK_API = "21a96ba57ee7a54bbbfbb7f0b180901f8f8a3ec9";

// 🔴 إعدادات ديسكورد
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "1532480930625884240";
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "fJ2SyQX5I_DY2IHUzn8EYnw6Pm6YFHAB"; 
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || ""; 
const DISCORD_SERVER_ID = process.env.DISCORD_SERVER_ID || "1135848445471629393";
const DISCORD_INVITE_URL = process.env.DISCORD_INVITE_URL || "https://discord.gg/hematech-1135848445471629393"; 
const REQUIRED_ROLE_ID = process.env.REQUIRED_ROLE_ID || "1271181175305797652"; 

// 🖼️ ميديا وبيانات السيرفر للعرض المطابق للصورة
const DISCORD_SERVER_NAME = process.env.DISCORD_SERVER_NAME || "HT | HemaTech";
const DISCORD_EST_DATE = process.env.DISCORD_EST_DATE || "Est. Aug 2023";
const DISCORD_BANNER_URL = process.env.DISCORD_BANNER_URL || "/banner.png"; 
const DISCORD_LOGO_URL = process.env.DISCORD_LOGO_URL || "/logos.png";     

const cache = new Map();
const spamCache = new Map(); 

const RATE_LIMIT_WINDOW = 60 * 1000; 
const MAX_REQUESTS = 5;

// 🛡️ واجهة الخطأ إذا كان الـ VPN مفعلاً
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
        :root { --bg-dark: #0c0d10; --glass-bg: rgba(20, 21, 25, 0.6); --text-main: #ffffff; }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
        body { background-color: var(--bg-dark); display: flex; justify-content: center; align-items: center; min-height: 100vh; color: var(--text-main); padding: 20px; }
        .container { width: 480px; max-width: 100%; padding: 40px 35px; border-radius: 28px; background: var(--glass-bg); backdrop-filter: blur(20px); border: 1px solid rgba(255, 165, 0, 0.4); text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.7); }
        h1 { color: #ffa500; margin-bottom: 15px; font-size: 1.8rem; font-weight: 800; }
        p { color: #aaa; font-size: 1.1rem; margin-bottom: 20px; line-height: 1.6; }
        .error-icon { font-size: 70px; color: #ffa500; margin-bottom: 25px; text-shadow: 0 0 20px rgba(255, 165, 0, 0.4); }
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

// 🟢 واجهة تحقق ديسكورد مصممة برمجياً لتطابق الصورة تماماً
const discordAuthUI = (discordAuthUrl, stats = { totalMembers: "13,804", onlineMembers: "167" }) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Discord Verification 🛡️</title>
    <link href="https://fonts.googleapis.com/css2?family=gg+sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { 
            --card-bg: #2b2d31; 
            --bg-dark: #111214; 
            --text-primary: #f2f3f5; 
            --text-muted: #949ba4;
            --discord-brand: #5865f2;
            --green-online: #23a55a;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'gg sans', 'Tajawal', sans-serif; }
        body { background-color: var(--bg-dark); display: flex; justify-content: center; align-items: center; min-height: 100vh; color: var(--text-primary); padding: 20px; }
        
        .discord-card { 
            width: 440px; max-width: 100%; border-radius: 20px; 
            background: var(--card-bg); overflow: hidden;
            box-shadow: 0 12px 30px rgba(0,0,0,0.5); position: relative;
        }

        /* Banner matching Discord style */
        .banner {
            width: 100%; height: 135px; 
            background: linear-gradient(135deg, #00b0f4 0%, #0084ff 100%), url('${DISCORD_BANNER_URL}') center/cover no-repeat;
            position: relative;
        }

        /* Logo Overlap */
        .avatar-container {
            position: absolute; top: 85px; left: 20px;
        }
        .server-avatar {
            width: 80px; height: 80px; border-radius: 22px;
            border: 6px solid var(--card-bg); object-fit: cover;
            background: #1e1f22; box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        }

        .card-body { padding: 45px 24px 24px 24px; text-align: left; }

        .server-title {
            display: flex; align-items: center; gap: 8px; font-size: 1.4rem; font-weight: 700; color: #fff; margin-bottom: 6px;
        }
        .verified-badge { color: #3ba55c; font-size: 1.1rem; }

        /* Statistics Line (Identical to Discord Profile Image) */
        .stats-line {
            display: flex; align-items: center; gap: 15px; font-size: 0.95rem; font-weight: 600; color: var(--text-muted); margin-bottom: 6px;
        }
        .stat-item { display: flex; align-items: center; gap: 6px; }
        .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
        .dot-online { background-color: var(--green-online); }
        .dot-offline { background-color: #80848e; }

        .est-date { font-size: 0.9rem; color: var(--text-muted); font-weight: 500; margin-bottom: 25px; }

        /* Action Buttons */
        .btn-group { display: flex; flex-direction: column; gap: 10px; }
        .btn { 
            display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; 
            padding: 14px; color: #fff; text-decoration: none; 
            font-weight: 600; border-radius: 12px; transition: all 0.2s; font-size: 0.95rem; border: none;
        }
        .btn-discord { background: var(--discord-brand); }
        .btn-discord:hover { background: #4752c4; }
        .btn-join { background: #35373c; color: #dbdee1; }
        .btn-join:hover { background: #3b3d44; color: #fff; }
    </style>
</head>
<body>
    <div class="discord-card">
        <div class="banner"></div>
        <div class="avatar-container">
            <img src="${DISCORD_LOGO_URL}" alt="Server Icon" class="server-avatar">
        </div>
        
        <div class="card-body">
            <div class="server-title">
                <span>${DISCORD_SERVER_NAME}</span>
                <i class="fa-solid fa-certificate verified-badge"></i>
            </div>

            <!-- Stats matched to your provided image -->
            <div class="stats-line">
                <div class="stat-item">
                    <span class="dot dot-online"></span> ${stats.onlineMembers} Online
                </div>
                <div class="stat-item">
                    <span class="dot dot-offline"></span> ${stats.totalMembers} Members
                </div>
            </div>

            <div class="est-date">${DISCORD_EST_DATE}</div>

            <div class="btn-group">
                <a href="${DISCORD_INVITE_URL}" target="_blank" class="btn btn-join">
                    <i class="fa-solid fa-user-plus"></i> 1. Join Server
                </a>
                <a href="${discordAuthUrl}" class="btn btn-discord">
                    <i class="fa-brands fa-discord"></i> 2. Verify Account & Role
                </a>
            </div>
        </div>
    </div>
</body>
</html>
`;

// Glassmorphism UI Generation with Custom Network Buttons
const generatePageHtml = (title, linkName, messageTitle, req, urls) => {
    const host = req.headers.host || "";
    const protocol = host.includes("localhost") ? "http" : "https";

    let actionHtml = '';

    const getNetworkButtons = (lootlabsUrl, linkvertiseUrl, nitroLinkUrl) => {
        let buttonsArray = [];
        
        if (lootlabsUrl) {
            buttonsArray.push(`
            <a href="${lootlabsUrl}" class="network-btn lootlabs-btn">
                <span class="btn-text"><i class="fa-solid fa-gem"></i> Unlock via LootLabs</span>
                <img src="/LootLabs.png" alt="LootLabs Logo" class="network-logo">
            </a>`);
        }

        if (linkvertiseUrl) {
            buttonsArray.push(`
            <a href="${linkvertiseUrl}" class="network-btn linkvertise-btn">
                <span class="btn-text"><i class="fa-solid fa-link"></i> Unlock via Linkvertise</span>
                <img src="/linkvertise.png" alt="Linkvertise Logo" class="network-logo link-logo">
            </a>`);
        }
        
        if (nitroLinkUrl) {
            buttonsArray.push(`
            <a href="${nitroLinkUrl}" class="network-btn nitrolink-btn">
                <span class="btn-text"><i class="fa-solid fa-rocket"></i> Unlock via Nitro Link</span>
                <img src="/nitrolink.png" alt="Nitro Link Logo" class="network-logo">
            </a>`);
        }

        return `<div class="networks-container">${buttonsArray.join(`<div class="or-divider"><span>OR</span></div>`)}</div>`;
    };

    if (urls.text) {
        actionHtml = `
        <div class="text-container">
            <textarea id="textContent" readonly rows="4">${urls.text}</textarea>
        </div>
        <button class="btn copy-btn" onclick="copyText()">
            Copy Text <i class="fa-solid fa-copy"></i>
        </button>
        <script>
            function copyText() {
                const text = document.getElementById("textContent");
                text.select();
                navigator.clipboard.writeText(text.value);
                const btn = document.querySelector(".copy-btn");
                btn.innerHTML = 'Copied! <i class="fa-solid fa-check"></i>';
                setTimeout(() => { btn.innerHTML = 'Copy Text <i class="fa-solid fa-copy"></i>'; }, 2000);
            }
        </script>`;
    } 
    else if (urls.lootlabs || urls.linkvertise || urls.nitroLink) {
        actionHtml = getNetworkButtons(urls.lootlabs, urls.linkvertise, urls.nitroLink);
    } 
    else if (urls.direct) {
        actionHtml = `
        <a href="${urls.direct}" class="btn default-btn">
            Direct Access (No Ads) <i class="fa-solid fa-arrow-right"></i>
        </a>`;
    }

    return `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<script src="https://beansnicerroller.com/1c/8c/07/1c8c07e41dacee6cc4a64a6f22c04a4b.js"></script>
<script>(function(s){s.dataset.zone='11383401',s.src='https://al5sm.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --primary: #ffd700; --bg-dark: #0c0d10; --glass-bg: rgba(20, 21, 25, 0.6); --text-main: #ffffff; }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
        body { background-color: var(--bg-dark); display: flex; justify-content: center; align-items: center; min-height: 100vh; color: var(--text-main); padding: 20px; }
        
        .container { 
            width: 480px; max-width: 100%; padding: 40px 35px; border-radius: 28px; 
            background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); 
            border: 1px solid rgba(255, 255, 255, 0.08); text-align: center; 
            box-shadow: 0 25px 50px rgba(0,0,0,0.5); 
        }
        
        .logo-container img { max-width: 180px; margin-bottom: 25px; }
        h1 { color: var(--primary); margin-bottom: 15px; font-size: 1.8rem; }
        .desc { color: #a0a0a0; margin-bottom: 30px; font-size: 1.1rem; }
        
        .networks-container { display: flex; flex-direction: column; gap: 16px; }
        
        .network-btn {
            position: relative; width: 100%; padding: 18px 24px; border-radius: 16px;
            cursor: pointer; text-decoration: none; display: flex; flex-direction: row;
            align-items: center; justify-content: space-between;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid rgba(255, 255, 255, 0.05); background: rgba(0, 0, 0, 0.3); overflow: hidden;
        }

        .btn-text { font-size: 16px; font-weight: 800; z-index: 2; display: flex; align-items: center; gap: 10px; }
        .network-logo { height: 24px; object-fit: contain; z-index: 2; max-width: 120px; }

        .lootlabs-btn { color: #ffd700; border-color: rgba(255, 215, 0, 0.15); }
        .lootlabs-btn:hover { transform: translateY(-4px); border-color: rgba(255, 215, 0, 0.5); box-shadow: 0 8px 25px rgba(255, 215, 0, 0.15); background: rgba(255, 215, 0, 0.05); }

        .linkvertise-btn { color: #4ade80; border-color: rgba(74, 222, 128, 0.15); }
        .linkvertise-btn:hover { transform: translateY(-4px); border-color: rgba(74, 222, 128, 0.5); box-shadow: 0 8px 25px rgba(74, 222, 128, 0.15); background: rgba(74, 222, 128, 0.05); }

        .nitrolink-btn { color: #ff5722; border-color: rgba(255, 87, 34, 0.15); }
        .nitrolink-btn:hover { transform: translateY(-4px); border-color: rgba(255, 87, 34, 0.5); box-shadow: 0 8px 25px rgba(255, 87, 34, 0.15); background: rgba(255, 87, 34, 0.05); }

        .or-divider { text-align: center; margin: 10px 0; position: relative; }
        .or-divider::before { content: ''; position: absolute; top: 50%; left: 0; width: 100%; height: 1px; background: rgba(255, 255, 255, 0.1); z-index: 1; }
        .or-divider span { background: var(--bg-dark); padding: 4px 14px; border-radius: 12px; font-size: 13px; font-weight: 800; color: #a0a0a0; position: relative; z-index: 2; border: 1px solid rgba(255, 255, 255, 0.1); }

        .default-btn { width: 100%; padding: 18px; border-radius: 16px; cursor: pointer; font-size: 17px; font-weight: 800; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 10px; color: #000; background: linear-gradient(135deg, var(--primary) 0%, #b89b00 100%); border: none; transition: transform 0.3s; }
        .default-btn:hover { transform: translateY(-4px); box-shadow: 0 8px 25px rgba(255, 215, 0, 0.2); }

        .text-container { background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 15px; margin-bottom: 20px; text-align: left; }
        textarea { width: 100%; background: transparent; border: none; color: var(--text-main); font-size: 16px; resize: none; outline: none; font-family: inherit; line-height: 1.5; }
        .copy-btn { width: 100%; padding: 16px; background: linear-gradient(135deg, var(--primary) 0%, #b89b00 100%); color: #000; border: none; border-radius: 16px; cursor: pointer; font-size: 18px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.3s; }
        .copy-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(255, 215, 0, 0.25); background: linear-gradient(135deg, #ffea00 0%, #c9a900 100%); }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-container"><img src="${DISCORD_LOGO_URL}" alt="Logo"></div>
        <h1><i class="fa-solid fa-shield-halved"></i> ${messageTitle}</h1>
        <div class="desc">Content ID: <strong>${linkName}</strong></div>
        ${actionHtml}
    </div>
</body>
</html>
    `;
};

export default async function handler(req, res) {
    if (req.method === "PATCH") {
        try {
            const { lootlabsEnabled, linkvertiseEnabled, nitrolinkEnabled, adminKey } = req.body;
            if (adminKey !== "MY_SECRET_ADMIN_PASSWORD") return res.status(401).json({ success: false, message: "Unauthorized" });

            const settings = { 
                lootlabs: Boolean(lootlabsEnabled), 
                linkvertise: Boolean(linkvertiseEnabled),
                nitrolink: Boolean(nitrolinkEnabled)
            };
            await db.collection("settings").doc("adNetworks").set(settings);
            cache.set("adSettings", settings);
            return res.status(200).json({ success: true, message: "Settings updated successfully", settings });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    if (req.method === "POST") {
        try {
            const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress || "unknown";
            const currentTime = Date.now();
            const userSpamData = spamCache.get(ip) || { count: 0, startTime: currentTime };

            if (currentTime - userSpamData.startTime > RATE_LIMIT_WINDOW) {
                userSpamData.count = 1;
                userSpamData.startTime = currentTime;
            } else {
                userSpamData.count++;
            }
            spamCache.set(ip, userSpamData);

            if (userSpamData.count > MAX_REQUESTS) return res.status(429).json({ success: false, message: "Too many requests!" });

            const { url, slug, tier, tasks } = req.body;
            if (!url) return res.status(400).json({ success: false, message: "URL required" });

            let id = (slug && slug.trim() !== "") ? slug.trim().toLowerCase() : nanoid(6);
            const exists = await db.collection("links").doc(id).get();
            if (exists.exists) return res.status(400).json({ success: false, message: "Alias in use" });

            await db.collection("links").doc(id).set({
                url, 
                completedTasksCount: 0, 
                lootlabsCompletions: 0, 
                linkvertiseCompletions: 0, 
                nitrolinkCompletions: 0,
                createdAt: Date.now(),
                tier: tier ? parseInt(tier) : 1,       
                tasks: tasks ? parseInt(tasks) : 3      
            });

            return res.status(200).json({ success: true, short: `${req.headers.origin}/${id}` });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    if (req.method === "GET") {
        const clientIp = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket?.remoteAddress;
        let isVPN = false;
        
        if (clientIp && clientIp !== "::1" && clientIp !== "127.0.0.1") {
            try {
                const response = await axios.get(`https://blackbox.ipinfo.app/lookup/${clientIp}`);
                if (typeof response.data === 'string' && response.data.trim() === 'Y') {
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

        const id = req.query.id;
        const cookieHeader = req.headers.cookie || '';

        let userHwid = req.query.hwid || req.query.state || null;
        if (!userHwid) {
            const hwidMatch = cookieHeader.match(/user_hwid=([^;]+)/);
            if (hwidMatch) userHwid = hwidMatch[1];
        }
        if (!userHwid && id) userHwid = id;

        const host = req.headers.host || "";
        const protocol = req.headers["x-forwarded-proto"] || (host.includes("localhost") ? "http" : "https");
        const redirectUri = `${protocol}://${host}/api/keysystem`;

        let cookieArray = [];
        if (userHwid) {
            cookieArray.push(`user_hwid=${userHwid}; Max-Age=86400; Path=/; SameSite=Lax`);
        }

        // ========================================================
        // 🟢 معالجة كود الديسكورد OAuth2
        // ========================================================
        if (req.query.code) {
            const code = req.query.code;
            try {
                const tokenRes = await axios.post("https://discord.com/api/oauth2/token", new URLSearchParams({
                    client_id: DISCORD_CLIENT_ID,
                    client_secret: DISCORD_CLIENT_SECRET,
                    grant_type: "authorization_code",
                    code: code,
                    redirect_uri: redirectUri
                }), { headers: { "Content-Type": "application/x-www-form-urlencoded" } });

                const tokenData = tokenRes.data;

                if (tokenData.access_token) {
                    const userRes = await axios.get("https://discord.com/api/users/@me", {
                        headers: { authorization: `Bearer ${tokenData.access_token}` }
                    });
                    const userData = userRes.data;
                    const discordUserId = userData.id;

                    let isMember = false;
                    let hasRole = false;

                    try {
                        const userGuildMemberRes = await axios.get(`https://discord.com/api/users/@me/guilds/${DISCORD_SERVER_ID}/member`, {
                            headers: { authorization: `Bearer ${tokenData.access_token}` }
                        });
                        if (userGuildMemberRes.status === 200) {
                            isMember = true;
                            const memberData = userGuildMemberRes.data;
                            if (REQUIRED_ROLE_ID === "YOUR_ROLE_ID_HERE" || !REQUIRED_ROLE_ID || memberData.roles.includes(REQUIRED_ROLE_ID)) {
                                hasRole = true;
                            }
                        }
                    } catch (e) {
                        if (DISCORD_BOT_TOKEN) {
                            try {
                                const botMemberRes = await axios.get(`https://discord.com/api/guilds/${DISCORD_SERVER_ID}/members/${discordUserId}`, {
                                    headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` }
                                });
                                if (botMemberRes.status === 200) {
                                    isMember = true;
                                    const memberData = botMemberRes.data;
                                    if (REQUIRED_ROLE_ID === "YOUR_ROLE_ID_HERE" || !REQUIRED_ROLE_ID || memberData.roles.includes(REQUIRED_ROLE_ID)) {
                                        hasRole = true;
                                    }
                                }
                            } catch (err) {}
                        }
                    }

                    if (isMember && hasRole) {
                        if (userHwid) {
                            await db.collection("discord_links").doc(userHwid).set({
                                discordId: discordUserId,
                                username: userData.username,
                                linkedAt: Date.now()
                            }, { merge: true });
                        }

                        cookieArray.push(`discord_verified=true; Max-Age=86400; Path=/; SameSite=Lax`);
                        res.setHeader('Set-Cookie', cookieArray);
                        
                        return res.redirect(302, id ? `/?id=${id}` : redirectUri);
                    } else {
                        let failReason = !isMember ? "لم تنضم إلى سيرفر الديسكورد الخاص بنا بعد!" : "ليس لديك الرتبة المطلوبة في السيرفر!";
                        res.setHeader("Content-Type", "text/html; charset=utf-8");
                        return res.status(400).send(`
                            <!DOCTYPE html>
                            <html>
                            <head><meta charset="utf-8"><title>Discord Verification Failed</title></head>
                            <body style="background:#07090f; color:#fff; text-align:center; font-family:sans-serif; padding:50px;">
                                <h1 style="color:#f87171;">فشل التحقق من ديسكورد ❌</h1>
                                <p style="font-size:18px; margin-bottom: 20px;">${failReason}</p>
                                <a href="${DISCORD_INVITE_URL}" target="_blank" style="color:#fff; background:#5865F2; padding:12px 25px; text-decoration:none; border-radius:10px; font-weight:bold; margin-right:10px; display:inline-block;">1. انضم للسيرفر أولاً</a>
                                <a href="${id ? `/?id=${id}` : redirectUri}" style="color:#000; background:#4ade80; padding:12px 25px; text-decoration:none; border-radius:10px; font-weight:bold; display:inline-block; margin-top: 15px;">2. محاولة التحقق مجدداً</a>
                            </body>
                            </html>
                        `);
                    }
                }
            } catch (e) {
                console.error("Discord Auth Error:", e.message);
            }
        }

        // 🟢 الفحص الحي لحالة التوثيق
        let isDiscordVerified = false;
        if (userHwid) {
            const linkCheck = await db.collection("discord_links").doc(userHwid).get();
            if (linkCheck.exists) {
                const discordUserId = linkCheck.data().discordId;
                if (DISCORD_BOT_TOKEN && discordUserId) {
                    try {
                        const memberRes = await axios.get(`https://discord.com/api/guilds/${DISCORD_SERVER_ID}/members/${discordUserId}`, {
                            headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` }
                        });
                        if (memberRes.status === 200) {
                            const memberData = memberRes.data;
                            if (REQUIRED_ROLE_ID === "YOUR_ROLE_ID_HERE" || !REQUIRED_ROLE_ID || memberData.roles.includes(REQUIRED_ROLE_ID)) {
                                isDiscordVerified = true;
                                cookieArray.push(`discord_verified=true; Max-Age=86400; Path=/; SameSite=Lax`);
                            } else {
                                await db.collection("discord_links").doc(userHwid).delete();
                                cookieArray.push(`discord_verified=; Max-Age=0; Path=/`);
                            }
                        }
                    } catch (err) {
                        isDiscordVerified = true; 
                    }
                } else {
                    isDiscordVerified = true;
                    cookieArray.push(`discord_verified=true; Max-Age=86400; Path=/; SameSite=Lax`);
                }
            }
        }

        // 📊 جلب إحصائيات السيرفر فورياً للواجهة (محاولة جلب Widget أولاً ثم API)
        let serverStats = { totalMembers: "13,804", onlineMembers: "167" };
        if (!isDiscordVerified && DISCORD_SERVER_ID) {
            try {
                // الطريقة الأولى المضمونة: الفحص بـ Widget السيرفر
                const widgetRes = await axios.get(`https://discord.com/api/guilds/${DISCORD_SERVER_ID}/widget.json`);
                if (widgetRes.data && widgetRes.data.presence_count) {
                    serverStats.onlineMembers = widgetRes.data.presence_count.toLocaleString();
                }

                // الطريقة الثانية: الفحص بـ Bot Token
                if (DISCORD_BOT_TOKEN) {
                    const guildRes = await axios.get(`https://discord.com/api/guilds/${DISCORD_SERVER_ID}?with_counts=true`, {
                        headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` }
                    });
                    if (guildRes.status === 200) {
                        if (guildRes.data.approximate_member_count) {
                            serverStats.totalMembers = guildRes.data.approximate_member_count.toLocaleString();
                        }
                        if (guildRes.data.approximate_presence_count) {
                            serverStats.onlineMembers = guildRes.data.approximate_presence_count.toLocaleString();
                        }
                    }
                }
            } catch (err) {
                console.log("Stats fetch fallback applied");
            }
        }

        if (!isDiscordVerified && DISCORD_CLIENT_ID !== "YOUR_DISCORD_CLIENT_ID") {
            const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20guilds%20guilds.members.read&state=${userHwid || ''}`;
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            if (cookieArray.length > 0) res.setHeader('Set-Cookie', cookieArray);
            return res.status(200).send(discordAuthUI(discordAuthUrl, serverStats));
        }

        if (cookieArray.length > 0) res.setHeader('Set-Cookie', cookieArray);
        // ========================================================

        try {
            if (!id) return res.status(404).send("Not Found");

            const doc = await db.collection("links").doc(id).get();
            if (!doc.exists) return res.status(404).send("Content not found");
            const data = doc.data();

            let adSettings = cache.get("adSettings");
            if (!adSettings) {
                const settingsDoc = await db.collection("settings").doc("adNetworks").get();
                adSettings = settingsDoc.exists ? settingsDoc.data() : { lootlabs: true, linkvertise: true, nitrolink: true }; 
                cache.set("adSettings", adSettings);
            }

            let urls = { lootlabs: null, linkvertise: null, nitroLink: null };
            
            const linkvertiseCompletionUrl = `https://subx.click/api/complete?id=${id}&network=linkvertise&tc=[tc]`;
            const lootlabsCompletionUrl = `https://subx.click/api/complete?id=${id}&network=lootlabs&tc=[tc]`;
            const nitroLinkCompletionUrl = `https://subx.click/api/complete?id=${id}&network=nitrolink`;

            const hasNitroCooldown = cookieHeader.includes('nitro_24h_cooldown=1');

            const shouldShowLinkvertise = (adSettings.linkvertise !== false) || hasNitroCooldown;

            if (shouldShowLinkvertise) {
                const base64Url = Buffer.from(linkvertiseCompletionUrl).toString('base64');
                const randomString = Math.random().toString(36).substring(7);
                urls.linkvertise = `https://link-to.net/${LINKVERTISE_USER_ID}/${randomString}/dynamic?r=${base64Url}`;
            }

            if (adSettings.lootlabs !== false) {
                try {
                    const response = await axios.post(
                        "https://creators.lootlabs.gg/api/public/content_locker",
                        { title: id, url: lootlabsCompletionUrl, tier_id: data.tier || 1, number_of_tasks: data.tasks || 3, theme: 1 },
                        { headers: { Authorization: `Bearer ${LOOTLABS_API}`, "Content-Type": "application/json" } }
                    );
                    const messageData = Array.isArray(response.data?.message) ? response.data.message[0] : response.data?.message;
                    urls.lootlabs = messageData?.loot_url || response.data?.loot_url;
                } catch (err) {
                    console.error("LootLabs API Error", err.message);
                }
            }

            if (adSettings.nitrolink !== false && !hasNitroCooldown) {
                try {
                    const reqUrl = `https://nitro-link.com/api?api=${NITRO_LINK_API}&url=${encodeURIComponent(nitroLinkCompletionUrl)}`;
                    const response = await axios.get(reqUrl);
                    if (response.data && response.data.status === 'success') {
                        urls.nitroLink = response.data.shortenedUrl;
                    }
                } catch (err) {
                    console.error("Nitro Link API Error", err.message);
                }
            }

            if (!urls.lootlabs && !urls.linkvertise && !urls.nitroLink) {
                const isUrlCheck = data.url.trim().startsWith("http");
                if (!isUrlCheck) {
                    urls.text = data.url; 
                } else {
                    urls.direct = data.url; 
                }
            }

            res.setHeader("Content-Type", "text/html; charset=utf-8");
            return res.status(200).send(generatePageHtml("Choose Verification", id, "Select a Method to Unlock", req, urls));

        } catch (err) {
            console.error("Error Details:", err.message);
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            return res.status(500).send("Internal Server Error");
        }
    }

    return res.status(405).send("Method Not Allowed");
}
