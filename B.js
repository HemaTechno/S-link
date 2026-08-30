import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const commands = [
    new SlashCommandBuilder()
        .setName('verify')
        .setDescription('الحصول على رابط التحقق لتخطّي المهام ورتبة 24 ساعة'),
    new SlashCommandBuilder()
        .setName('claim')
        .setDescription('استلام رتبة الـ 24 ساعة بعد إتمام المهام بنجاح')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
    try {
        console.log('جارِ تسجيل أوامر الـ Slash Commands...');

        // تسجيل الأوامر على مستوى السيرفر (تظهر فوراً في سيرفرك بدون انتظار)
        await rest.put(
            Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
            { body: commands },
        );

        console.log('✅ تم تسجيل الأوامر بنجاح! يمكنك فتح ديسكورد وتجربتها الآن.');
    } catch (error) {
        console.error(error);
    }
})();
