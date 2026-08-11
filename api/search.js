// api/search.js
export default async function handler(req, res) {
    const { name } = req.query;

    if (!name) {
        return res.status(400).json({ error: "الرجاء كتابة اسم الماب" });
    }

    try {
        // 1. استخدام API البحث الجديد من روبلوكس (omni-search) للحصول على الـ Universe ID
        const searchUrl = `https://apis.roblox.com/search-api/omni-search?searchQuery=${encodeURIComponent(name)}&pageType=all`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();

        let universeId = null;
        
        // استخراج رقم اللعبة من نتائج البحث
        if (searchData.searchResults && searchData.searchResults.length > 0) {
            const gameResult = searchData.searchResults.find(item => item.universeId) || searchData.searchResults[0];
            universeId = gameResult.universeId;
        }

        if (!universeId) {
            return res.status(404).json({ error: "لم يتم العثور على الماب" });
        }

        // 2. تحويل الـ Universe ID إلى Place ID (لأن بحث السيرفرات بيحتاج Place ID)
        const gameDetailsUrl = `https://games.roblox.com/v1/games?universeIds=${universeId}`;
        const gameDetailsResponse = await fetch(gameDetailsUrl);
        const gameDetailsData = await gameDetailsResponse.json();

        if (gameDetailsData && gameDetailsData.data && gameDetailsData.data.length > 0) {
            const placeId = gameDetailsData.data[0].rootPlaceId;
            const gameName = gameDetailsData.data[0].name;

            // حفظ النتيجة في الكاش لمدة يوم عشان تقليل الضغط وسرعة البحث
            res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate'); 
            return res.status(200).json({ placeId: placeId, name: gameName });
        }

        return res.status(404).json({ error: "تعذر استخراج بيانات الماب" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "فشل الاتصال بخوادم روبلوكس" });
    }
}
