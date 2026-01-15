const { cmd } = require("../command");
const axios = require("axios");
const cheerio = require("cheerio");

cmd(
  {
    pattern: "sinhalasub",
    alias: ["ssub", "movie2"],
    desc: "Search movies from Sinhalasub.lk",
    category: "download",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("🎬 කරුණාකර චිත්‍රපටයේ නම ලබා දෙන්න. (උදා: .sinhalasub Leo)");

      await bot.sendMessage(from, { react: { text: "🔍", key: mek.key } });

      const searchUrl = `https://sinhalasub.lk/?s=${encodeURIComponent(q)}`;
      
      const { data } = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(data);
      let results = [];

      // Sinhalasub හි movies අඩංගු වන tags සොයා ගැනීම
      $("article").each((i, el) => {
        const title = $(el).find(".entry-title a").text().trim();
        const link = $(el).find(".entry-title a").attr("href");
        const image = $(el).find(".post-thumbnail img").attr("src");

        if (title && link) {
          results.push({ title, link, image });
        }
      });

      if (results.length === 0) {
        await bot.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ කිසිදු ප්‍රතිඵලයක් හමු නොවීය.");
      }

      // පළමු ප්‍රතිඵලය පෙන්වීම
      const movie = results[0];
      
      let caption = `🎬 *${movie.title}*\n\n`;
      caption += `🔗 *Link:* ${movie.link}\n\n`;
      caption += `💡 *බාගත කිරීමට:* .download [සෘජු ලින්ක් එක]`;

      await bot.sendMessage(
        from,
        {
          image: { url: movie.image },
          caption: caption,
        },
        { quoted: mek }
      );

      await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      console.log("SINHALASUB ERROR:", e);
      reply("❌ සර්වර් එක සම්බන්ධ කරගැනීමේ දෝෂයක්. පසුව උත්සාහ කරන්න.");
    }
  }
);
