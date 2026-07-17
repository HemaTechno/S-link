import { useState } from 'react';

export default function BoostAdmin() {
    const [url, setUrl] = useState('');
    const [slug, setSlug] = useState('');
    const [tier, setTier] = useState('1');
    const [tasks, setTasks] = useState('3');
    const [ytSub, setYtSub] = useState('');
    const [ytLike, setYtLike] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');
    const [copyText, setCopyText] = useState('نسخ الرابط');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // تجميع مهام السوشيال ميديا النشطة فقط
        const socialTasks = [];
        if (ytSub.trim()) {
            socialTasks.push({ type: "sub", url: ytSub.trim() });
        }
        if (ytLike.trim()) {
            socialTasks.push({ type: "like", url: ytLike.trim() });
        }

        const requestData = {
            url: url.trim(),
            slug: slug.trim(),
            tier: parseInt(tier),
            tasks: parseInt(tasks),
            socialTasks: socialTasks
        };

        try {
            const response = await fetch('/api/boost-api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();

            if (result.success) {
                // تعديل الرابط الراجع ليشير مباشرة لصفحة العرض بداخل الـ api
                const apiViewUrl = result.short.replace('/boost-view', '/api/boost-view');
                setGeneratedLink(apiViewUrl);
            } else {
                alert("حدث خطأ أثناء إنشاء الرابط: " + result.message);
            }
        } catch (err) {
            alert("فشل الاتصال بالخادم، تأكد من أن السيرفر يعمل.");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedLink).then(() => {
            setCopyText('تم النسخ! ✓');
            setTimeout(() => setCopyText('نسخ الرابط'), 2000);
        });
    };

    return (
        <div style={styles.body}>
            <div style={styles.container}>
                <h2 style={styles.title}>لوحة تحكم Boost Social</h2>
                <p style={styles.subtitle}>قم بإنشاء روابط ذكية تجبر الزائر على تنفيذ مهام السوشيال ميديا أولاً</p>
                
                <form onSubmit={handleSubmit}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>الرابط النهائي (الذي سيصله المستخدم في النهاية):</label>
                        <input 
                            type="url" 
                            style={styles.input} 
                            placeholder="https://example.com/file.zip" 
                            value={url} 
                            onChange={(e) => setUrl(e.target.value)} 
                            required 
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>اسم مخصص للرابط (Slug) - اختياري:</label>
                        <input 
                            type="text" 
                            style={styles.input} 
                            placeholder="مثال: roblox-script" 
                            value={slug} 
                            onChange={(e) => setSlug(e.target.value)} 
                        />
                    </div>

                    <div style={styles.grid}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>مستوى إعلانات LootLabs:</label>
                            <select style={styles.select} value={tier} onChange={(e) => setTier(e.target.value)}>
                                <option value="1">Tier 1 (أعلى أرباح)</option>
                                <option value="2">Tier 2</option>
                                <option value="3">Tier 3 (أسهل للزائر)</option>
                            </select>
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>عدد مهام LootLabs:</label>
                            <select style={styles.select} value={tasks} onChange={(e) => setTasks(e.target.value)}>
                                <option value="1">مهمة واحدة</option>
                                <option value="2">مهمتين</option>
                                <option value="3">3 مهام (موصى به)</option>
                                <option value="4">4 مهام</option>
                            </select>
                        </div>
                    </div>

                    <div style={styles.sectionTitle}>مهام الدعم الاجتماعي (اترك الحقل فارغاً لتجاهله)</div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>رابط الاشتراك في قناة اليوتيوب:</label>
                        <input 
                            type="url" 
                            style={styles.input} 
                            placeholder="https://youtube.com/channel/..." 
                            value={ytSub} 
                            onChange={(e) => setYtSub(e.target.value)} 
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>رابط الإعجاب بمقطع فيديو (لايك):</label>
                        <input 
                            type="url" 
                            style={styles.input} 
                            placeholder="https://youtube.com/watch?v=..." 
                            value={ytLike} 
                            onChange={(e) => setYtLike(e.target.value)} 
                        />
                    </div>

                    <button type="submit" style={styles.btnSubmit} disabled={loading}>
                        {loading ? "جاري التوليد..." : "توليد رابط الـ Boost"}
                    </button>
                </form>

                {generatedLink && (
                    <div style={styles.resultBox}>
                        <div style={styles.resultTitle}>تم توليد الرابط بنجاح! 🎉</div>
                        <span style={styles.resultLink}>{generatedLink}</span>
                        <button style={styles.btnCopy} onClick={copyToClipboard}>{copyText}</button>
                    </div>
                )}
            </div>
        </div>
    );
}

// تصميم الواجهة (CSS in JS) لتكون متناسقة وسريعة التحميل
const styles = {
    body: {
        background: '#0d0e12',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: "'Tajawal', sans-serif",
        direction: 'rtl',
        padding: '20px',
        boxSizing: 'border-box',
    },
    container: {
        background: '#16171e',
        border: '1px solid #252733',
        padding: '30px',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '500px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
    },
    title: {
        marginTop: 0,
        fontSize: '24px',
        color: '#fff',
        textAlign: 'center',
        marginBottom: '8px',
    },
    subtitle: {
        color: '#a0aec0',
        fontSize: '13px',
        textAlign: 'center',
        marginBottom: '25px',
    },
    formGroup: {
        marginBottom: '18px',
    },
    label: {
        display: 'block',
        fontSize: '14px',
        fontWeight: 'bold',
        marginBottom: '8px',
        color: '#cbd5e0',
    },
    input: {
        width: '100%',
        padding: '12px',
        background: '#1f202b',
        border: '1px solid #2d303f',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '14px',
        outline: 'none',
        boxSizing: 'border-box',
    },
    select: {
        width: '100%',
        padding: '12px',
        background: '#1f202b',
        border: '1px solid #2d303f',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '14px',
        outline: 'none',
        boxSizing: 'border-box',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '15px',
    },
    sectionTitle: {
        fontSize: '15px',
        fontWeight: 'bold',
        color: '#3182ce',
        margin: '20px 0 12px 0',
        borderBottom: '1px solid #2d303f',
        paddingBottom: '6px',
    },
    btnSubmit: {
        background: '#3182ce',
        color: 'white',
        border: 'none',
        width: '100%',
        padding: '14px',
        borderRadius: '10px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
        marginTop: '15px',
    },
    resultBox: {
        background: '#1a202c',
        border: '1px dashed #4a5568',
        padding: '15px',
        borderRadius: '10px',
        marginTop: '25px',
        textAlign: 'center',
    },
    resultTitle: {
        fontWeight: 'bold',
        color: '#48bb78',
        marginBottom: '10px',
        fontSize: '15px',
    },
    resultLink: {
        background: '#10141d',
        padding: '10px',
        borderRadius: '6px',
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#3182ce',
        wordBreak: 'break-all',
        display: 'block',
        marginBottom: '12px',
        direction: 'ltr',
    },
    btnCopy: {
        background: '#4a5568',
        color: 'white',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '13px',
    }
};
