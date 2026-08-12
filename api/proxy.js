// api/proxy.js
export default async function handler(req, res) {
    // ---------------------------------------------------------
    // 0. إعدادات حماية CORS للسماح بالطلبات بشكل صحيح
    // ---------------------------------------------------------
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // ---------------------------------------------------------
    // 1. نظام إرسال إشعارات الديسكورد (لو الطلب نوعه POST)
    // ---------------------------------------------------------
    if (req.method === 'POST') {
        const { mapName, placeId, players, serverId, resultType } = req.body;
        
        // رابط الويب هوك الخاص بك
        const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1536851517783412736/dR3kKSOwr_Zw3S9Si871CrIaE-vZbTv-cL1vsckw8VYcf8UsrV2AlIQ0buVUyMHZIakz";

        const gameLink = `https://www.roblox.com/games/${placeId}`;
        const joinDirectLink = serverId ? `roblox://placeId=${placeId}&gameInstanceId=${serverId}` : "N/A";

        let embedTitle = `Search Result: ${mapName}`;
        let embedColor = 0;
        let embedDescription = "";
        let fields = [];

        // معالجة البيانات حسب النتيجة بدقة لتجنب أخطاء الديسكورد
        if (resultType === "SUCCESS") {
            embedTitle = `🎉 Empty Server Found: ${mapName}`;
            embedColor = 3066993; // أخضر
            embedDescription = `**Quick Join (PC):**\n\`${joinDirectLink}\``;
            fields.push({ name: "👥 Players Inside", value: `**${players || 0}** Player(s)`, inline: true });
            
        } else if (resultType === "WARNING") {
            embedTitle = `⚠️ Lowest Server Found: ${mapName}`;
            embedColor = 16766720; // أصفر
            embedDescription = `**Quick Join (PC):**\n\`${joinDirectLink}\``;
            fields.push({ name: "👥 Players Inside", value: `**${players || 0}** Player(s)`, inline: true });
            
        } else {
            embedTitle = `❌ Search Failed: ${mapName}`;
            embedColor = 15158332; // أحمر
            embedDescription = `No servers were available to join at this moment.`;
        }

        fields.push({ name: "🔗 Game Page", value: `[View on Roblox](${gameLink})`, inline: true });

        const payload = {
            username: "Server Hunter Bot",
            avatar_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Roblox_player_icon_black.svg/512px-Roblox_player_icon_black.svg.png",
            embeds: [
                {
                    title: embedTitle,
                    description: embedDescription,
                    url: gameLink,
                    color: embedColor,
                    fields: fields,
                    footer: { text: "Powered by Vercel Serverless" },
                    timestamp: new Date().toISOString()
                }
            ]
        };

        try {
            const discordRes = await fetch(DISCORD_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!discordRes.ok) {
                console.error("Discord API rejected payload.");
                return res.status(500).json({ error: "Discord Error" });
            }
            
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: "Failed to trigger webhook" });
        }
    }

    // ---------------------------------------------------------
    // 2. نظام جلب السيرفرات من روبلوكس (لو الطلب نوعه GET)
    // ---------------------------------------------------------
    const { placeId, cursor } = req.query;

    if (!placeId) {
        return res.status(400).json({ error: "Place ID is required" });
    }

    let url = `https://games.roblox.com/v1/games/${placeId}/servers/Public?sortOrder=Asc&limit=100`;
    if (cursor) {
        url += `&cursor=${cursor}`;
    }

    try {
        const response = await fetch(url);
        
        if (response.status === 429) {
            return res.status(429).json({ error: "Rate limited by Roblox" });
        }

        const data = await response.json();
        res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');
        res.status(200).json(data);
        
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch servers data" });
    }
}
