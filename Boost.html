export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).send("Method Not Allowed");
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>لوحة تحكم Boost Social</title>
            <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet">
            <style>
                body {
                    background: #0d0e12;
                    color: #e2e8f0;
                    font-family: 'Tajawal', sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                    padding: 20px;
                    box-sizing: border-box;
                }
                .admin-container {
                    background: #16171e;
                    border: 1px solid #252733;
                    padding: 30px;
                    border-radius: 16px;
                    width: 100%;
                    max-width: 500px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.4);
                }
                h2 {
                    margin-top: 0;
                    font-size: 24px;
                    color: #fff;
                    text-align: center;
                    margin-bottom: 8px;
                }
                p.subtitle {
                    color: #a0aec0;
                    font-size: 13px;
                    text-align: center;
                    margin-bottom: 25px;
                }
                .form-group {
                    margin-bottom: 18px;
                }
                label {
                    display: block;
                    font-size: 14px;
                    font-weight: bold;
                    margin-bottom: 8px;
                    color: #cbd5e0;
                }
                input, select {
                    width: 100%;
                    padding: 12px;
                    background: #1f202b;
                    border: 1px solid #2d303f;
                    border-radius: 8px;
                    color: #fff;
                    font-family: 'Tajawal', sans-serif;
                    box-sizing: border-box;
                    font-size: 14px;
                    transition: border-color 0.2s;
                }
                input:focus, select:focus {
                    outline: none;
                    border-color: #3182ce;
                }
                .grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }
                .section-title {
                    font-size: 15px;
                    font-weight: bold;
                    color: #3182ce;
                    margin: 20px 0 12px 0;
                    border-bottom: 1px solid #2d303f;
                    padding-bottom: 6px;
                }
                .btn-submit {
                    background: #3182ce;
                    color: white;
                    border: none;
                    width: 100%;
                    padding: 14px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: bold;
                    transition: background 0.2s;
                    margin-top: 15px;
                }
                .btn-submit:hover {
                    background: #2b6cb0;
                }
                .result-box {
                    background: #1a202c;
                    border: 1px dashed #4a5568;
                    padding: 15px;
                    border-radius: 10px;
                    margin-top: 25px;
                    display: none;
                    text-align: center;
                }
                .result-title {
                    font-weight: bold;
                    color: #48bb78;
                    margin-bottom: 10px;
                    font-size: 15px;
                }
                .result-link {
                    background: #10141d;
                    padding: 10px;
                    border-radius: 6px;
                    font-family: monospace;
                    font-size: 14px;
                    color: #3182ce;
                    word-break: break-all;
                    display: block;
                    margin-bottom: 12px;
                    direction: ltr;
                }
                .btn-copy {
                    background: #4a5568;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 13px;
                }
                .btn-copy:hover {
                    background: #718096;
                }
            </style>
        </head>
        <body>
            <div class="admin-container">
                <h2>لوحة تحكم Boost Social</h2>
                <p class="subtitle">قم بإنشاء روابط ذكية تجبر الزائر على تنفيذ مهام السوشيال ميديا أولاً</p>
                
                <form id="boost-form">
                    <div class="form-group">
                        <label for="url">الرابط النهائي (الذي سيصله المستخدم في النهاية):</label>
                        <input type="url" id="url" placeholder="https://example.com/file.zip" required>
                    </div>

                    <div class="form-group">
                        <label for="slug">اسم مخصص للرابط (Slug) - اختياري:</label>
                        <input type="text" id="slug" placeholder="مثال: roblox-script">
                    </div>

                    <div class="grid">
                        <div class="form-group">
                            <label for="tier">مستوى إعلانات LootLabs (Tier):</label>
                            <select id="tier">
                                <option value="1">Tier 1 (أعلى أرباح)</option>
                                <option value="2">Tier 2</option>
                                <option value="3">Tier 3 (أسهل للمستخدم)</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="tasks">عدد مهام LootLabs:</label>
                            <select id="tasks">
                                <option value="1">مهمة واحدة</option>
                                <option value="2">مهمتين</option>
                                <option value="3" selected>3 مهام (موصى به)</option>
                                <option value="4">4 مهام</option>
                            </select>
                        </div>
                    </div>

                    <div class="section-title">مهام الدعم الاجتماعي (اترك الحقل فارغاً لتجاهله)</div>

                    <div class="form-group">
                        <label for="yt-sub">رابط الاشتراك في قناة اليوتيوب:</label>
                        <input type="url" id="yt-sub" placeholder="https://youtube.com/channel/...">
                    </div>

                    <div class="form-group">
                        <label for="yt-like">رابط الإعجاب بمقطع فيديو (لايك):</label>
                        <input type="url" id="yt-like" placeholder="https://youtube.com/watch?v=...">
                    </div>

                    <button type="submit" class="btn-submit" id="submit-btn">توليد رابط الـ Boost</button>
                </form>

                <div class="result-box" id="result-box">
                    <div class="result-title">تم توليد الرابط بنجاح! 🎉</div>
                    <span class="result-link" id="generated-link"></span>
                    <button class="btn-copy" id="copy-btn" onclick="copyLink()">نسخ الرابط</button>
                </div>
            </div>

            <script>
                document.getElementById('boost-form').addEventListener('submit', async (e) => {
                    e.preventDefault();

                    const submitBtn = document.getElementById('submit-btn');
                    const resultBox = document.getElementById('result-box');
                    const generatedLink = document.getElementById('generated-link');

                    submitBtn.innerText = "جاري الإنشاء...";
                    submitBtn.disabled = true;

                    const socialTasks = [];
                    const subUrl = document.getElementById('yt-sub').value.trim();
                    const likeUrl = document.getElementById('yt-like').value.trim();

                    if (subUrl) socialTasks.push({ type: "sub", url: subUrl });
                    if (likeUrl) socialTasks.push({ type: "like", url: likeUrl });

                    const requestData = {
                        url: document.getElementById('url').value.trim(),
                        slug: document.getElementById('slug').value.trim(),
                        tier: parseInt(document.getElementById('tier').value),
                        tasks: parseInt(document.getElementById('tasks').value),
                        socialTasks: socialTasks
                    };

                    try {
                        const response = await fetch('/api/boost-api', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(requestData)
                        });

                        const result = await response.json();

                        if (result.success) {
                            // تحويل الرابط تلقائياً ليشير لمسار الـ api الخاص بصفحة العرض
                            const cleanUrl = result.short.replace('/boost-view', '/api/boost-view');
                            generatedLink.innerText = cleanUrl;
                            resultBox.style.display = "block";
                            resultBox.scrollIntoView({ behavior: 'smooth' });
                        } else {
                            alert("حدث خطأ: " + result.message);
                        }
                    } catch (err) {
                        alert("فشل الاتصال بالخادم، تأكد من سلامة الكود.");
                    } finally {
                        submitBtn.innerText = "توليد رابط الـ Boost";
                        submitBtn.disabled = false;
                    }
                });

                function copyLink() {
                    const linkText = document.getElementById('generated-link').innerText;
                    navigator.clipboard.writeText(linkText).then(() => {
                        const copyBtn = document.getElementById('copy-btn');
                        copyBtn.innerText = "تم النسخ! ✓";
                        copyBtn.style.background = "#38a169";
                        setTimeout(() => {
                            copyBtn.innerText = "نسخ الرابط";
                            copyBtn.style.background = "#4a5568";
                        }, 2000);
                    });
                }
            </script>
        </body>
        </html>
    `);
}
