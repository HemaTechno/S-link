import { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // حدد آي دي الروم اللي عايز الرسالة تثبت فيها
    const channel = await client.channels.fetch('1135848559607021680');

    // تصميم رسالة فخمة
    const embed = new EmbedBuilder()
        .setTitle('🔐 نظام الحصول على مفتاح 24 ساعة')
        .setDescription('مرحباً بك! للحصول على صلاحية الـ **24 ساعة** والمفتاح الخاص بك، اتبع الخطوات البسيطة التالية:\n\n1️⃣ اضغط على زر **Verify** للحصول على رابط التخطي الخاص بك.\n2️⃣ قم بإتمام المهام المطلوبة في الرابط.\n3️⃣ ارجع هنا واضغط على زر **Claim** لتفقد إتمامك واستلام رتبتك فوراً!')
        .setColor(0x00AE86)
        .setFooter({ text: 'نظام الحماية والتحقق التلقائي' });

    // إنشاء الزرين
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('btn_verify')
                .setLabel('Verify (رابط التحقق)')
                .setStyle(ButtonStyle.Primary) // لون أزرق
                .setEmoji('🔗'),
            new ButtonBuilder()
                .setCustomId('btn_claim')
                .setLabel('Claim (استلام الرتبة)')
                .setStyle(ButtonStyle.Success) // لون أخضر
                .setEmoji('🎉'),
        );

    // إرسال الرسالة الثابتة للروم
    await channel.send({ embeds: [embed], components: [row] });
    console.log('✅ تم إرسال الرسالة الثابتة بنجاح!');
    process.exit();
});

client.login(process.env.DISCORD_BOT_TOKEN);
