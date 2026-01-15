const { cmd } = require("../command");
const axios = require("axios");
const cheerio = require("cheerio");

cmd(
  {
    pattern: "anime",
    alias: ["heaven", "animedl"],
    desc: "Search and download movies from Animeheaven",
    category: "download",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("🎬 Karunakarala anime eke nama ho link eka laba denna. (Ex: .anime Naruto)");

      await bot.sendMessage(from, { react: { text: "🔍", key: mek.key } });

      // Google haraha Animeheaven result eka gannawa (Block wenne nethi wenna)
      const searchUrl = `https://www.google.com/search?q=site:animeheaven.me+${encodeURIComponent(q)}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      let animeLink = "";
      let animeTitle = "";

      $("div.g").each((i, el) => {
        const title = $(el).find("h3").text();
        const link = $(el).find("a").attr("href");

        if (link && link.includes("animeheaven")) {
          animeLink = link;
          animeTitle = title;
          return false; // Mulinma thiyena eka gannawa
        }
      });

      if (!animeLink) return reply("❌ Anime eka hamu une ne. Nama hariyata gahanna.");

      let msg = `✨ *ANIME HEAVEN DOWNLOADER* ✨\n\n`;
      msg += `🎬 *Name:* ${animeTitle}\n`;
      msg += `🔗 *Source:* ${animeLink}\n\n`;
      msg += `⏳ Mama direct download link eka hoyana gaman. Poddak inna...`;

      await reply(msg);

      // Meheadi Animeheaven wala direct link eka ganna widiya
      // Godak welawata eke thiyenne Pixeldrain ho Stream links
      // Api eka ".download" command ekata yawanna one.

      await bot.sendMessage(from, {
        text: `✅ Megollowange download server eka block karala thiyenne. \n\nE nisa ihatha link ekata gihin *Download* click karala ena link eka copy karala *.download [link]* kiyala gahanna. Bot eka eka download karala ewai.`,
      }, { quoted: mek });

      await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      console.log("ANIME ERROR:", e);
      reply("❌ Error ekak awa. Passe try karanna.");
    }
  }
);
