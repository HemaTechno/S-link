
// api/proxy.js
export default async function handler(req, res) {
    // ---------------------------------------------------------
    // 1. نظام إرسال إشعارات الديسكورد (لو الطلب نوعه POST)
    // ---------------------------------------------------------
    if (req.method === 'POST') {
        const { mapName, placeId, players, serverId } = req.body;
        
        // ضع رابط الديسكورد ويب هوك الخاص بك هنا
        const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1536851517783412736/dR3kKSOwr_Zw3S9Si871CrIaE-vZbTv-cL1vsckw8VYcf8UsrV2AlIQ0buVUyMHZIakz";

        const gameLink = `https://www.roblox.com/games/${placeId}`;
        const joinDirectLink = `roblox://placeId=${placeId}&gameInstanceId=${serverId}`;

        const payload = {
            username: "Server Hunter Bot",
            avatar_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Roblox_player_icon_black.svg/512px-Roblox_player_icon_black.svg.png",
            embeds: [
                {
                    title: `🎯 Server Found: ${mapName}`,
                    description: `A user just found a server using your tool!\n\n**Quick Join (PC):**\n\`${joinDirectLink}\``,
                    url: gameLink,
                    color: 3093151,
                    fields: [
                        { name: "👥 Players Inside", value: `**${players}** Player(s)`, inline: true },
                        { name: "🔗 Game Page", value: `[View on Roblox](${gameLink})`, inline: true }
                    ],
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
        
        // كاش لمدة 10 ثواني
        res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');
        res.status(200).json(data);
        
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch servers data" });
    }
}
