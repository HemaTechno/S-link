// api/webhook.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { mapName, placeId, players, serverId } = req.body;

    // حط رابط الويب هوك بتاع الديسكورد بتاعك هنا بين علامتين التنصيص
    const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1536851517783412736/dR3kKSOwr_Zw3S9Si871CrIaE-vZbTv-cL1vsckw8VYcf8UsrV2AlIQ0buVUyMHZIakz";

    const gameLink = `https://www.roblox.com/games/${placeId}`;
    const joinDirectLink = `roblox://placeId=${placeId}&gameInstanceId=${serverId}`;

    const payload = {
        username: "Server Hunter Bot",
        avatar_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Roblox_player_icon_black.svg/512px-Roblox_player_icon_black.svg.png",
        embeds: [
            {
                title: `🎯 Server Found: ${mapName}`,
                description: `A user just found a server using the tool!\n\n**Quick Join (Click if on PC):**\n\`${joinDirectLink}\``,
                url: gameLink,
                color: 3093151, // الأزرق الفاتح
                fields: [
                    { name: "👥 Players Inside", value: `**${players}** Player(s)`, inline: true },
                    { name: "🔗 Game Page", value: `[View on Roblox](${gameLink})`, inline: true }
                ],
                // الديسكورد هيسحب صورة الماب تلقائياً بمجرد وجود رابط اللعبة فوق
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
