// api/search.js
export default async function handler(req, res) {
    const { name } = req.query;

    if (!name) {
        return res.status(400).json({ error: "الرجاء كتابة اسم الماب" });
    }

    const searchUrl = `https://games.roblox.com/v1/games/list?keyword=${encodeURIComponent(name)}&limit=10`;

    try {
        const response = await fetch(searchUrl);
        const data = await response.json();

        if (data && data.games && data.games.length > 0) {
            const placeId = data.games[0].placeId || data.games[0].rootPlaceId; 
            
            // كاش لمدة يوم كامل (لأن الـ ID بتاع المابات مبيتغيرش)
            res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate'); 
            return res.status(200).json({ placeId: placeId, name: data.games[0].name });
        }

        return res.status(404).json({ error: "لم يتم العثور على الماب" });

    } catch (error) {
        res.status(500).json({ error: "فشل الاتصال بخوادم روبلوكس" });
    }
}
