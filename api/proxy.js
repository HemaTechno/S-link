// api/proxy.js
export default async function handler(req, res) {
    const { placeId, cursor } = req.query;

    if (!placeId) {
        return res.status(400).json({ error: "Place ID is required" });
    }

    // ترتيب تصاعدي (Asc) عشان نجيب السيرفرات الفاضية الأول
    let url = `https://games.roblox.com/v1/games/${placeId}/servers/Public?sortOrder=Asc&limit=100`;
    
    if (cursor) {
        url += `&cursor=${cursor}`;
    }

    try {
        const response = await fetch(url);
        
        // التعامل مع الـ Rate Limit
        if (response.status === 429) {
            return res.status(429).json({ error: "Rate limited by Roblox" });
        }

        const data = await response.json();
        
        // كاش لمدة 10 ثواني عشان لو كذا يوزر بيبحثوا ميحصلش ضغط
        res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');
        res.status(200).json(data);
        
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch servers data" });
    }
}
