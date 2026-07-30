const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const admin = require('firebase-admin');

// تأكد أنك مهيئ فايربيس مسبقاً في ملف البوت
const db = admin.firestore();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.once('ready', () => {
    console.log(`Bot logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;
    const discordUserId = interaction.user.id;

    // 1. أمر /my-key (عرض المفتاح والوقت المتبقي)
    if (commandName === 'my-key') {
        await interaction.deferReply({ ephemeral: true });

        try {
            // البحث عن الـ HWID المرتبط بهذا الـ Discord ID في قاعدة البيانات
            const linksSnapshot = await db.collection("discord_links").where("discordId", "==", discordUserId).get();
            
            if (linksSnapshot.empty) {
                return interaction.editReply("❌ You haven't linked your device yet! Please generate a key through the website first.");
            }

            const hwid = linksSnapshot.docs[0].id;

            // البحث عن المفتاح الفعال المرتبط بهذا الـ HWID
            const keysSnapshot = await db.collection("keys").where("hwid", "==", hwid).get();

            if (keysSnapshot.empty) {
                return interaction.editReply("⚠️ You don't have an active key right now. Visit the website to get a new one!");
            }

            const keyData = keysSnapshot.docs[0].data();
            const timeLeft = keyData.expiresAt - Date.now();

            if (timeLeft <= 0) {
                return interaction.editReply("⌛ Your key has expired! Please get a new one.");
            }

            // حساب الساعات والدقائق المتبقية
            const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

            const embed = new EmbedBuilder()
                .setTitle("🔑 Your Active SubX Key")
                .setColor(0xf59e0b)
                .addFields(
                    { name: "Key", value: `\`${keyData.key}\``, inline: false },
                    { name: "Time Remaining", value: `⏳ ${hoursLeft} hours and ${minutesLeft} minutes`, inline: true },
                    { name: "Linked HWID", value: `\`${hwid.substring(0, 10)}...\``, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: "SubX Premium System" });

            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            console.error(err);
            await interaction.editReply("❌ An error occurred while fetching your key.");
        }
    }

    // 2. أمر /help (المساعدة)
    if (commandName === 'help') {
        const embed = new EmbedBuilder()
            .setTitle("🤖 SubX Bot Commands")
            .setColor(0x10b981)
            .setDescription("Here are the available commands you can use:")
            .addFields(
                { name: "/my-key", value: "Check your active key and remaining time." },
                { name: "/help", value: "Show this help menu." }
            )
            .setFooter({ text: "SubX Support System" });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);
