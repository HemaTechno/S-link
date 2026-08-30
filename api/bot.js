import { db } from './api/firebase.js'; // استيراد قاعدة البيانات من ملفك الجاهز
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import nacl from 'tweetnacl'; // للتحقق من أمان طلبات ديسكورد

// دالة التحقق من توقيع ديسكورد الأمني
function verifyDiscordRequest(req) {
    const signature = req.headers['x-signature-ed25519'];
    const timestamp = req.headers['x-signature-timestamp'];
    const body = JSON.stringify(req.body);
    if (!signature || !timestamp) return false;
    return nacl.sign.detached.verify(
        Buffer.from(timestamp + body),
        Buffer.from(signature, 'hex'),
        Buffer.from(process.env.DISCORD_PUBLIC_KEY, 'hex')
    );
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    // تأمين الـ Webhook الخاص بديسكورد
    if (!verifyDiscordRequest(req)) {
        return res.status(401).send('Invalid request signature');
    }

    const interaction = req.body;

    // 1. الاستجابة لتأكيد اتصال ديسكورد (Ping)
    if (interaction.type === 1) {
        return res.json({ type: 1 });
    }

    // 2. أمر /verify (طلب رابط التخطي)
    if (interaction.type === 2 && interaction.data.name === 'verify') {
        const discordUserId = interaction.member?.user?.id || interaction.user?.id;
        const linkId = "123"; // استبدل بـ Link ID الخاص بك في Boostylink

        try {
            // توليد رابط المتتبع من Boostylink
            const response = await fetch(`https://boostylink.com/api/v1/links/${linkId}/redirect`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.BOOSTYLINK_API_KEY}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ click_id: discordUserId, bind_ip: false })
            });

            const data = await response.json();

            if (data.url) {
                return res.json({
                    type: 4,
                    data: {
                        content: `🔗 **أهلاً بك يا عمار!** إليك رابط التحقق الخاص بك لإتمام المهام:\n> ${data.url}\n\n*بعد إتمام المهام، قم كتابة أمر `/claim` لتفعيل رتبتك مباشرة!*`,
                        flags: 64 // تظهر الرسالة للمستخدم وحده سراً
                    }
                });
            } else {
                throw new Error("فشل توليد الرابط");
            }
        } catch (error) {
            return res.json({ type: 4, data: { content: "⚠️ حدث خطأ تقني أثناء إنشاء الرابط، حاول لاحقاً.", flags: 64 } });
        }
    }

    // 3. أمر /claim (استلام الرتبة بعد إتمام المهام)
    if (interaction.type === 2 && interaction.data.name === 'claim') {
        const discordUserId = interaction.member?.user?.id || interaction.user?.id;
        const linkId = "123";

        try {
            // فحص حالة الإتمام عبر Boostylink API
            const checkRes = await fetch(`https://boostylink.com/api/v1/completions/${discordUserId}?link_id=${linkId}`, {
                headers: { 'Authorization': `Bearer ${process.env.BOOSTYLINK_API_KEY}`, 'Accept': 'application/json' }
            });
            const checkData = await checkRes.json();

            if (checkData.status !== 'completed') {
                return res.json({ type: 4, data: { content: "❌ عذراً، لم تقم بإتمام المهام المطلوبة في الرابط بعد!", flags: 64 } });
            }

            // استهلاك المكافأة لمرة واحدة لمنع التكرار
            const consumeRes = await fetch(`https://boostylink.com/api/v1/completions/${discordUserId}/consume?link_id=${linkId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${process.env.BOOSTYLINK_API_KEY}`, 'Accept': 'application/json' }
            });
            const consumeData = await consumeRes.json();

            if (consumeData.first_consume || consumeData.success) {
                // حفظ بيانات العضو في Firebase وتحديد وقت انتهاء الرتبة بعد 24 ساعة
                const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // الوقت الحالي + 24 ساعة بالمللي ثانية
                await setDoc(doc(db, "vip_users", discordUserId), {
                    discordId: discordUserId,
                    expiresAt: expiresAt,
                    assignedAt: Date.now()
                });

                // إعطاء الرتبة عبر Discord API مباشرة
                await fetch(`https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/members/${discordUserId}/roles/${process.env.DISCORD_ROLE_ID}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}` }
                });

                return res.json({ type: 4, data: { content: "🎉 **مبروك!** تم التحقق بنجاح وتم منحك الرتبة المميزة لمدة **24 ساعة** قادمة!", flags: 64 } });
            } else {
                return res.json({ type: 4, data: { content: "⚠️ لقد استهلكت هذه المكافأة مسبقاً!", flags: 64 } });
            }

        } catch (err) {
            return res.json({ type: 4, data: { content: "⚠️ حدث خطأ أثناء منح الرتبة.", flags: 64 } });
        }
    }

    return res.status(400).send('Unknown interaction');
}
