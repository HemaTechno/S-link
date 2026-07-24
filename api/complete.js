import db from "./firebase.js";

// Success UI Generation (English version with Logo)
const generateSuccessPage = (finalUrl) => `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<script src="https://beansnicerroller.com/1c/8c/07/1c8c07e41dacee6cc4a64a6f22c04a4b.js"></script>

<script>(function(s){s.dataset.zone='11383401',s.src='https://al5sm.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Successfully Bypassed</title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
    
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --bg-dark: #0c0d10;
            --glass-bg: rgba(20, 21, 25, 0.6);
            --glass-border: rgba(255, 255, 255, 0.08);
            --text-main: #ffffff;
            --success-color: #4ade80;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
        body {
            background-color: var(--bg-dark);
            background-image: radial-gradient(at 10% 10%, rgba(74, 222, 128, 0.05) 0px, transparent 50%),
                              radial-gradient(at 90% 90%, rgba(74, 222, 128, 0.05) 0px, transparent 50%);
            display: flex; justify-content: center; align-items: center; min-height: 100vh; color: var(--text-main); padding: 20px;
        }
        .container {
            width: 480px; max-width: 100%; padding: 40px 35px; border-radius: 28px;
            background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border); text-align: center;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.05);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .container:hover { transform: translateY(-3px); box-shadow: 0 30px 60px rgba(74, 222, 128, 0.05); }
        
        /* تنسيق اللوجو */
        .logo-container { text-align: center; margin-bottom: 25px; }
        .logo-container img { max-width: 180px; height: auto; display: inline-block; }

        h1 { color: var(--success-color); margin-bottom: 25px; font-size: 2rem; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 10px; text-shadow: 0px 2px 10px rgba(74, 222, 128, 0.2); }
        .warning-box {
            background: rgba(255, 80, 80, 0.05); border: 1px solid rgba(248, 113, 113, 0.3);
            color: #f87171; padding: 18px; border-radius: 16px; margin-bottom: 25px; font-weight: 600; font-size: 15px; line-height: 1.6;
        }
        .btn {
            width: 100%; padding: 16px; background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white; border: none; border-radius: 16px; cursor: pointer; font-size: 18px; font-weight: 800;
            text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 10px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 6px 20px rgba(16, 185, 129, 0.15);
        }
        .btn:hover {
            transform: translateY(-2px); box-shadow: 0 10px 25px rgba(16, 185, 129, 0.25);
            background: linear-gradient(135deg, #34d399 0%, #059669 100%);
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- اللوجو -->
        <div class="logo-container">
            <img src="/logo.png" alt="Website Logo">
        </div>

        <h1><i class="fa-solid fa-circle-check"></i> Successfully Bypassed!</h1>
        
        <div class="warning-box">
            <i class="fa-solid fa-triangle-exclamation"></i> 
            <strong>Attention:</strong> The final page might open pop-up ads. Please close them to download your file safely.
        </div>

        <a href="${finalUrl}" class="btn">
            Click here to get the link <i class="fa-solid fa-download"></i>
        </a>
    </div>
</body>
</html>
`;

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).send("Method Not Allowed");
    }

    const { id } = req.query;

    if (!id) {
        return res.status(400).send("Missing Link ID");
    }

    try {
        const doc = await db.collection("links").doc(id).get();

        if (!doc.exists) {
            return res.status(404).send("Link not found");
        }

        const data = doc.data();

        await doc.ref.update({
            completedTasksCount: (data.completedTasksCount || 0) + 1,
            lastCompletedAt: Date.now()
        });

        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.status(200).send(generateSuccessPage(data.url));

    } catch (err) {
        console.error("Error in completion handler:", err);
        try {
            const doc = await db.collection("links").doc(id).get();
            if (doc.exists) {
                res.setHeader("Content-Type", "text/html; charset=utf-8");
                return res.status(200).send(generateSuccessPage(doc.data().url));
            }
        } catch {}
        
        return res.status(500).send("An error occurred while processing the completion request");
    }
}
