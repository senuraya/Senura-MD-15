const { cmd } = require("../command");
const axios = require("axios");
const cheerio = require("cheerio");

cmd(
  {
    pattern: "cinesub",
    alias: ["cine", "msearch"],
    desc: "Search movies from Cinesubz",
    category: "download",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("🎬 කරුණාකර චිත්‍රපටයේ නම ලබා දෙන්න.");

      await bot.sendMessage(from, { react: { text: "🔍", key: mek.key } });

      const scraperKey = "7114c6edc7fd34b555aaefde6946ec35";
      
      // 1. සෘජුවම සයිට් එකේ Search API එකට Request එක යවමු
      // ඔයා එවපු JSON එකේ තිබුණේ මේ API එක: https://cinesubz.net/wp-json/zetaflix/search/
      const apiUrl = `https://cinesubz.net/wp-json/zetaflix/search/?keyword=${encodeURIComponent(q)}`;
      const proxyUrl = `http://api.scraperapi.com?api_key=${scraperKey}&url=${encodeURIComponent(apiUrl)}`;

      const res = await axios.get(proxyUrl);
      
      // API එකෙන් ලැබෙන දත්ත පරීක්ෂාව
      if (!res.data || res.data.length === 0 || !res.data[0].url) {
          return reply("❌ Cinesubz හි එවැනි ප්‍රතිඵලයක් හමු නොවීය. කරුණාකර නම නිවැරදිදැයි බලන්න.");
      }

      const movie = res.data[0];
      const movieLink = movie.url;
      const title = movie.title;
      const poster = movie.img;

      // 2. Movie Page එකට ගොස් විස්තර සහ Pixeldrain ලින්ක් ලබාගනිමු
      const movieProxy = `http://api.scraperapi.com?api_key=${scraperKey}&url=${encodeURIComponent(movieLink)}&render=true`;
      const movieRes = await axios.get(movieProxy);
      const $ = cheerio.load(movieRes.data);

      const plot = $(".entry-content p").first().text().trim() || "විස්තරයක් ලබාගත නොහැක.";
      
      let downloadLinks = "\n🔗 *DOWNLOAD LINKS* 🔗\n\n";
      let hasLinks = false;

      // Pixeldrain සහ Mega ලින්ක් සෙවීම
      $("a").each((i, el) => {
          const href = $(el).attr("href");
          if (href && (href.includes("pixeldrain.com") || href.includes("mega.nz"))) {
              const name = $(el).text().trim() || "Download";
              downloadLinks += `🚀 ${name}: ${href}\n\n`;
              hasLinks = true;
          }
      });

      // 3. මූවී කාඩ් එක යැවීම
      let detailsMsg = `🅢🅔🅒🅡🅔🅣 🅜🅞🅥🅘🅔 🅒🅛🅤🅑 🅒🅘🅝🅔🅜 Cinema 🎦\n\n`;
      detailsMsg += `📌 *Title:* ${title}\n\n`;
      detailsMsg += `📝 *සාරාංශය:* \n${plot.substring(0, 350)}...\n\n`;
      detailsMsg += hasLinks ? downloadLinks : "⚠️ _සෘජු බාගත කිරීමේ ලින්ක් හමු නොවීය._\n\n";
      detailsMsg += `🌐 *Source:* ${movieLink}`;

      await bot.sendMessage(from, { 
          image: { url: poster }, 
          caption: detailsMsg 
      }, { quoted: mek });

      await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      console.log("CINESUB ERROR:", e.message);
      reply("❌ සම්බන්ධතාවය බිඳ වැටුණි. කරුණාකර නැවත උත්සාහ කරන්න.");
    }
  }
);
