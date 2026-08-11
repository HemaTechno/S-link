// api/proxy.js
export default async function handler(req, res) {
    // ---------------------------------------------------------
    // 1. نظام إرسال إشعارات الديسكورد (لو الطلب نوعه POST)
    // ---------------------------------------------------------
    if (req.method === 'POST') {
        const { mapName, placeId, players, serverId, resultType } = req.body;
        
        // حط رابط الويب هوك بتاعك هنا
        const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1536851517783412736/dR3kKSOwr_Zw3S9Si871CrIaE-vZbTv-cL1vsckw8VYcf8UsrV2AlIQ0buVUyMHZIakz";

        const gameLink = `https://www.roblox.com/games/${placeId}`;
        const joinDirectLink = serverId ? `roblox://placeId=${placeId}&gameInstanceId=${serverId}` : null;

        let embedTitle = "";
        let embedColor = 0;
        let embedDescription = "";
        let fields = [];

        // تحديد محتوى الإشعار بناءً على النتيجة
        if (resultType === "SUCCESS") {
            embedTitle = `🎉 Empty Server Found: ${mapName}`;
            embedColor = 3066993; // أخضر
            embedDescription = `A user just found an empty server!\n\n**Quick Join (PC):**\n\`${joinDirectLink}\``;
            fields.push({ name: "👥 Players Inside", value: `**${players}** Player(s)`, inline: true });
            fields.push({ name: "🔗 Game Page", value: `[View on Roblox](${gameLink})`, inline: true });
            
        } else if (resultType === "WARNING") {
            embedTitle = `⚠️ Lowest Server Found: ${mapName}`;
            embedColor = 16766720; // أصفر
            embedDescription = `No completely empty servers, but found the lowest populated one.\n\n**Quick Join (PC):**\n\`${joinDirectLink}\``;
            fields.push({ name: "👥 Players Inside", value: `**${players}** Player(s)`, inline: true });
            fields.push({ name: "🔗 Game Page", value: `[View on Roblox](${gameLink})`, inline: true });
            
        } else if (resultType === "FAILED") {
            embedTitle = `❌ Search Failed: ${mapName}`;
            embedColor = 15158332; // أحمر
            embedDescription = `A user searched for an empty server, but absolutely no servers were available to join.`;
            fields.push({ name: "🔗 Game Page", value: `[View on Roblox](${gameLink})`, inline: true });
        }

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
            await fetch(DISCORD_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
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
        
        // كاش لمدة 10 ثواني لتخفيف الضغط
        res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');
        res.status(200).json(data);
        
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch servers data" });
    }
}
