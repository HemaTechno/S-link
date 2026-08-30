import { db } from './api/firebase.js'; // ملف الاتصال بفايربيس الخاص بك
import nacl from 'tweetnacl';
import axios from 'axios';

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
    if (!verifyDiscordRequest(req)) return res.status(401).send('Invalid request signature');

    const interaction = req.body;

    if (interaction.type === 1) return res.json({ type: 1 });

    // التعامل مع الأزرار التفاعلية
    if (interaction.type === 3) {
        const customId = interaction.data.custom_id;
        const discordUserId = interaction.member?.user?.id || interaction.user?.id;
        const username = interaction.member?.user?.username || interaction.user?.username;
        const linkId = "42"; // استبدل بـ Link ID الخاص بك

        // 1. زر Verify
        if (customId === 'btn_verify') {
            try {
                const response = await axios.post(`https://boostylink.com/api/v1/links/${linkId}/redirect`, {
                    click_id: discordUserId,
                    bind_ip: false
                }, {
                    headers: {
                        'Authorization': `Bearer ${process.env.BOOSTYLINK_API_KEY}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });

                const data = response.data;

                if (data.url) {
                    return res.json({
                        type: 4,
                        data: {
                            content: `🔗 **رابط التحقق الخاص بك:**\n> ${data.url}\n\n*الرابط خاص بك وحدك! بعد إتمام المهام، ارجع للرسالة الرئيسية واضغط على زر **Claim**.*`,
                            flags: 64 
                        }
                    });
                } else {
                    throw new Error("فشل توليد الرابط");
                }
            } catch (error) {
                return res.json({ type: 4, data: { content: "⚠️ حدث خطأ أثناء إنشاء الرابط، حاول لاحقاً.", flags: 64 } });
            }
        }

        // 2. زر Claim
        if (customId === 'btn_claim') {
            try {
                const checkRes = await axios.get(`https://boostylink.com/api/v1/completions/${discordUserId}?link_id=${linkId}`, {
                    headers: { 'Authorization': `Bearer ${process.env.BOOSTYLINK_API_KEY}`, 'Accept': 'application/json' }
                });
                const checkData = checkRes.data;

                if (checkData.status !== 'completed') {
                    return res.json({ type: 4, data: { content: "❌ عذراً، لم تقم بإتمام المهام المطلوبة في الرابط بعد!", flags: 64 } });
                }

                const consumeRes = await axios.post(`https://boostylink.com/api/v1/completions/${discordUserId}/consume?link_id=${linkId}`, {}, {
                    headers: { 'Authorization': `Bearer ${process.env.BOOSTYLINK_API_KEY}`, 'Accept': 'application/json' }
                });
                const consumeData = consumeRes.data;

                if (consumeData.first_consume || consumeData.success) {
                    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); 
                    
                    // الحفظ باستخدام firebase-admin الصحيح
                    await db.collection("vip_users").doc(discordUserId).set({
                        discordId: discordUserId,
                        expiresAt: expiresAt,
                        assignedAt: Date.now()
                    });

                    // منح الرتبة عبر ديسكورد
                    await axios.put(`https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/members/${discordUserId}/roles/${process.env.DISCORD_ROLE_ID}`, {}, {
                        headers: { 'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}` }
                    });

                    // إرسال الإشعار عبر الويب هوك
                    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
                    if (webhookUrl) {
                        await axios.post(webhookUrl, {
                            content: `🎉 العضو <@${discordUserId}> (**${username}**) نجح في تخطي الرابط وحصل على صلاحية الـ **24 ساعة** ومفتاحه بنجاح! 🔓✨`
                        });
                    }

                    return res.json({ 
                        type: 4, 
                        data: { 
                            content: "🎉 **مبروك!** تم التحقق ومنحك الرتبة بنجاح لمدة 24 ساعة. يمكنك الآن الحصول على مفتاحك!", 
                            flags: 64 
                        } 
                    });
                } else {
                    return res.json({ type: 4, data: { content: "⚠️ لقد استهلكت هذه المكافأة مسبقاً!", flags: 64 } });
                }

            } catch (err) {
                console.error(err);
                return res.json({ type: 4, data: { content: "⚠️ حدث خطأ أثناء تنفيذ الطلب.", flags: 64 } });
            }
        }
    }

    return res.status(400).send('Unknown interaction');
        }
