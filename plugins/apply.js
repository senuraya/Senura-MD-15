const { cmd } = require("../command");
const fs = require("fs");

cmd(
  {
    pattern: "apply",
    desc: "Set custom caption for downloader",
    category: "owner",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply, isOwner }) => {
    try {
      // මෙය Owner ට පමණක් කළ හැකි ලෙස සැකසීම ආරක්ෂිතයි
      // if (!isOwner) return reply("❌ මෙය කළ හැක්කේ බොට්ගේ අයිතිකරුට පමණි.");

      if (!q) return reply("✏️ කරුණාකර අලුත් Caption එක ඇතුළත් කරන්න.\n\n*භාවිතා කළ හැකි Tags:* \n{filename} - ෆයිල් එකේ නම\n{size} - ෆයිල් එකේ ප්‍රමාණය");

      // Caption එක ෆයිල් එකක සේව් කිරීම
      fs.writeFileSync("./caption.txt", q);
      
      reply("✅ Caption එක සාර්ථකව වෙනස් කළා!\n\n*නව Caption එක:* \n" + q);
    } catch (e) {
      reply("❌ දෝෂයක් සිදු විය.");
    }
  }
);
