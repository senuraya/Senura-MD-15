const { cmd } = require("../command");
const axios = require("axios");
const mimes = require("mime-types");
const fs = require("fs");

cmd(
  {
    pattern: "download",
    alias: ["direct", "dl"],
    desc: "Download files with dynamic caption",
    category: "download",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("🔗 කරුණාකර සෘජු ලින්ක් එකක් ලබා දෙන්න.");

      await bot.sendMessage(from, { react: { text: "⏳", key: mek.key } });

      const response = await axios.head(q);
      const mimeType = response.headers["content-type"];
      const fileSize = (response.headers["content-length"] / (1024 * 1024)).toFixed(2);

      let extension = mimes.extension(mimeType) || "bin";
      let fileName = q.split("/").pop().split("?")[0] || "file";
      if (!fileName.endsWith(`.${extension}`)) fileName = `${fileName}.${extension}`;

      // කලින් සේව් කරපු Caption එක කියවීම (නැතිනම් default එකක් ගැනීම)
      let customCaption = "✅ *Downloaded Successfully*";
      if (fs.existsSync("./caption.txt")) {
        customCaption = fs.readFileSync("./caption.txt", "utf8");
      }

      // Tags වෙනුවට නියම දත්ත ආදේශ කිරීම
      let finalCaption = customCaption
        .replace(/{filename}/g, fileName)
        .replace(/{size}/g, fileSize + " MB");

      await bot.sendMessage(
        from,
        {
          document: { url: q },
          mimetype: mimeType,
          fileName: fileName,
          caption: finalCaption,
        },
        { quoted: mek }
      );

      await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      reply("❌ දෝෂයක් සිදු විය.");
    }
  }
);
