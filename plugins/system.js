const { cmd } = require("../command");

// 1. RUNTIME COMMAND
cmd(
  {
    pattern: "runtime",
    alias: ["uptime", "status"],
    desc: "Check how long the bot has been running",
    category: "main",
    filename: __filename,
  },
  async (bot, mek, m, { from, reply }) => {
    try {
      const runtime = process.uptime(); // සෙකන්ඩ් ගණන ලබා ගනී
      
      const hours = Math.floor(runtime / 3600);
      const minutes = Math.floor((runtime % 3600) / 60);
      const seconds = Math.floor(runtime % 60);

      const uptimeString = `🕒 *Bot Runtime:* \n\n` +
                           `⏳ *Hours:* ${hours}h\n` +
                           `⏳ *Minutes:* ${minutes}m\n` +
                           `⏳ *Seconds:* ${seconds}s`;

      await bot.sendMessage(from, { react: { text: "🕘", key: mek.key } });
      return reply(uptimeString);
      
    } catch (e) {
      console.log(e);
      reply("❌ දෝෂයක් සිදු විය.");
    }
  }
);

// 2. RESTART COMMAND
cmd(
  {
    pattern: "restart",
    alias: ["reboot"],
    desc: "Restart the bot",
    category: "owner",
    filename: __filename,
  },
  async (bot, mek, m, { from, reply, isOwner }) => {
    try {
      // මෙය Owner ට පමණක් කළ හැකි ලෙස තැබීම සුදුසුයි
      // if (!isOwner) return reply("❌ මෙය කළ හැක්කේ බොට්ගේ අයිතිකරුට පමණි.");

      await bot.sendMessage(from, { react: { text: "🔄", key: mek.key } });
      await reply("🔄 බොට් එක නැවත පණගැන්වෙමින් පවතී... කරුණාකර තත්පර කිහිපයක් රැඳී සිටින්න.");

      // බොට් එක නතර කර නැවත පණගැන්වීමට (Process එක Exit කරයි)
      setTimeout(() => {
        process.exit();
      }, 1500);

    } catch (e) {
      console.log(e);
      reply("❌ රීස්ටාර්ට් කිරීමේදී දෝෂයක් සිදු විය.");
    }
  }
);
