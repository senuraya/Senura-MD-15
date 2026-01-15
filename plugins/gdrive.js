const { cmd } = require("../command");
const axios = require("axios");
const fs = require("fs");

cmd(
  {
    pattern: "gdrive",
    alias: ["gd", "drive"],
    desc: "Download from GDrive with Virus Warning Bypass",
    category: "download",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("🔗 කරුණාකර Google Drive ලින්ක් එකක් ලබා දෙන්න.");

      const driveRegex = /[-\w]{25,}(?!.*[-\w]{25,})/;
      const match = q.match(driveRegex);
      if (!match) return reply("❌ මෙය වලංගු Google Drive ලින්ක් එකක් නොවේ.");
      const fileId = match[0];

      await bot.sendMessage(from, { react: { text: "⏳", key: mek.key } });

      // 1. Virus Warning එක Bypass කිරීමට Confirm Token එක ලබා ගැනීම
      const getUrl = `https://docs.google.com/uc?export=download&id=${fileId}`;
      const response = await axios.get(getUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });

      // HTML එක ඇතුළේ ඇති 'confirm' කියන token එක සෙවීම
      const confirmToken = response.data.match(/confirm=([^&]+)/)?.[1];
      
      // 2. Direct Link එක සැකසීම (Confirm token එක සහිතව හෝ රහිතව)
      let finalDownloadUrl = getUrl;
      if (confirmToken) {
        finalDownloadUrl = `https://docs.google.com/uc?export=download&confirm=${confirmToken}&id=${fileId}`;
      }

      // 3. Headers වලින් තොරතුරු ලබා ගැනීම
      const head = await axios.head(finalDownloadUrl).catch(() => null);
      const mimeType = head ? head.headers["content-type"] : "application/octet-stream";
      const fileSizeNum = head ? head.headers["content-length"] : 0;
      const fileSize = (fileSizeNum / (1024 * 1024)).toFixed(2);
      const fileName = `GDrive_File_${fileId.substring(0, 5)}`;

      // 4. Custom Caption කියවීම
      let customCaption = "✅ *Google Drive Download Success*";
      if (fs.existsSync("./caption.txt")) {
        customCaption = fs.readFileSync("./caption.txt", "utf8");
      }

      let finalCaption = customCaption
        .replace(/{filename}/g, fileName)
        .replace(/{size}/g, (fileSizeNum > 0 ? fileSize : "Unknown") + " MB");

      // 5. ෆයිල් එක යැවීම
      await bot.sendMessage(
        from,
        {
          document: { url: finalDownloadUrl },
          mimetype: mimeType,
          fileName: fileName,
          caption: finalCaption,
        },
        { quoted: mek }
      );

      await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      console.log("GDRIVE ERROR:", e.message);
      reply("❌ බාගත කිරීමේදී දෝෂයක් සිදු විය. ලින්ක් එක Public කර ඇත්දැයි සහ දෛනික සීමාව (Quota) පැන ඇත්දැයි පරීක්ෂා කරන්න.");
    }
  }
);
