// api/search.js
export default async function handler(req, res) {
    const { name } = req.query;

    if (!name) {
        return res.status(400).json({ error: "الرجاء كتابة اسم الماب" });
    }

    // 1. Headers وهمية عشان نعدي من حماية روبلوكس (Cloudflare / Anti-Bot)
    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9"
    };

    try {
        // --- المحاولة الأولى: استخدام API الألعاب المباشر ---
        const url1 = `https://games.roblox.com/v1/games/list?keyword=${encodeURIComponent(name)}&limit=10`;
        const res1 = await fetch(url1, { headers });
        
        if (res1.ok) {
            const data1 = await res1.json();
            if (data1.games && data1.games.length > 0) {
                const placeId = data1.games[0].placeId || data1.games[0].rootPlaceId;
                res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
                return res.status(200).json({ placeId: placeId, name: data1.games[0].name });
            }
        }

        // --- المحاولة الثانية: لو الأولى مقفولة، نجرب نظام Omni-Search ---
        const url2 = `https://apis.roblox.com/search-api/omni-search?searchQuery=${encodeURIComponent(name)}&pageType=all`;
        const res2 = await fetch(url2, { headers });
        
        if (res2.ok) {
            const data2 = await res2.json();
            let universeId = null;
            
            // استخراج الـ Universe ID
            if (data2.searchResults) {
                const result = data2.searchResults.find(item => item.universeId);
                if (result) universeId = result.universeId;
            }

            if (universeId) {
                // تحويل الـ Universe ID لـ Place ID
                const url3 = `https://games.roblox.com/v1/games?universeIds=${universeId}`;
                const res3 = await fetch(url3, { headers });
                
                if (res3.ok) {
                    const data3 = await res3.json();
                    if (data3.data && data3.data.length > 0) {
                        res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
                        return res.status(200).json({ 
                            placeId: data3.data[0].rootPlaceId, 
                            name: data3.data[0].name 
                        });
                    }
                }
            }
        }

        // لو المحاولتين فشلوا أو الماب مش موجودة
        return res.status(404).json({ error: "لم يتم العثور على الماب، جرب استخدام الـ ID أو اللينك." });

    } catch (error) {
        console.error("Search API Error:", error);
        return res.status(500).json({ error: "روبلوكس رفضت الطلب (حظر مؤقت). استخدم اللينك أو الـ ID." });
    }
}
