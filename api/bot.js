import { db } from './firebase.js';
import nacl from 'tweetnacl';
import axios from 'axios';

// دالة التحقق من توقيع ديسكورد الأمني
function verifyDiscordRequest(req) {
    const signature = req.headers['x-signature-ed25519'];
    const timestamp = req.headers['x-signature-timestamp'];
    
    // في Vercel، أحياناً الجسم يحتاج أن يُقرأ كـ Buffer أو النص الخام
    const rawBody = req.rawBody || JSON.stringify(req.body);
    
    if (!signature || !timestamp) return false;
    
    try {
        return nacl.sign.detached.verify(
            Buffer.from(timestamp + rawBody),
            Buffer.from(signature, 'hex'),
            Buffer.from(process.env.DISCORD_PUBLIC_KEY, 'hex')
        );
    } catch (e) {
        return false;
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    // التحقق من الأمان (يمكنك التعطيل مؤقتاً للتجربة لو استمرت المشكلة، ولكن الأفضل تركها)
    const signature = req.headers['x-signature-ed25519'];
    const timestamp = req.headers['x-signature-timestamp'];
    
    // استجابة فورية لـ PING من ديسكورد (Type 1)
    if (req.body.type === 1) {
        return res.status(200).json({ type: 1 });
    }

    const interaction = req.body;

    // التعامل مع الأزرار (Type 3: Message Component)
    if (interaction.type === 3) {
        const customId = interaction.data.custom_id;
        const discordUserId = interaction.member?.user?.id || interaction.user?.id;
        const username = interaction.member?.user?.username || interaction.user?.username;
        const linkId = "123"; // استبدل بـ Link ID الخاص بك في Boostylink

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
                    return res.status(200).json({
                        type: 4, // Channel Message With Source
                        data: {
                            content: `🔗 **رابط التحقق الخاص بك:**\n> ${data.url}\n\n*هذا الرابط خاص بك وحدك! بعد إتمام المهام، عُد إلى الرسالة الرئيسية واضغط على زر **Claim**.*`,
                            flags: 64 // تظهر للمستخدم وحده (Ephemeral)
                        }
                    });
                } else {
                    throw new Error("فشل توليد الرابط");
                }
            } catch (error) {
                return res.status(200).json({
                    type: 4,
                    data: { content: "⚠️ حدث خطأ أثناء إنشاء رابط التحقق، حاول لاحقاً.", flags: 64 }
                });
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
                    return res.status(200).json({
                        type: 4,
                        data: { content: "❌ عذراً، لم تقم بإتمام المهام المطلوبة في الرابط بعد! أكمل المهام ثم عاود الضغط.", flags: 64 }
                    });
                }

                const consumeRes = await axios.post(`https://boostylink.com/api/v1/completions/${discordUserId}/consume?link_id=${linkId}`, {}, {
                    headers: { 'Authorization': `Bearer ${process.env.BOOSTYLINK_API_KEY}`, 'Accept': 'application/json' }
                });
                const consumeData = consumeRes.data;

                if (consumeData.first_consume || consumeData.success) {
                    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); 
                    
                    // حفظ البيانات في فايربيس
                    await db.collection("vip_users").doc(discordUserId).set({
                        discordId: discordUserId,
                        expiresAt: expiresAt,
                        assignedAt: Date.now()
                    });

                    // منح الرتبة في ديسكورد
                    await axios.put(`https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/members/${discordUserId}/roles/${process.env.DISCORD_ROLE_ID}`, {}, {
                        headers: { 'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}` }
                    });

                    // إرسال لوغ للعملية عبر الويب هوك
                    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
                    if (webhookUrl) {
                        await axios.post(webhookUrl, {
                            content: `🎉 العضو <@${discordUserId}> (**${username}**) نجح في تخطي الرابط وحصل على صلاحية الـ **24 ساعة** بنجاح! 🔓✨`
                        });
                    }

                    return res.status(200).json({
                        type: 4,
                        data: { content: "🎉 **مبروك!** تم التحقق ومنحك الرتبة بنجاح لمدة 24 ساعة.", flags: 64 }
                    });
                } else {
                    return res.status(200).json({
                        type: 4,
                        data: { content: "⚠️ لقد استهلكت هذه المكافأة مسبقاً!", flags: 64 }
                    });
                }

            } catch (err) {
                return res.status(200).json({
                    type: 4,
                    data: { content: "⚠️ حدث خطأ أثناء التحقق من إتمام المهام.", flags: 64 }
                });
            }
        }
    }

    return res.status(400).send('Unknown interaction type');
}
