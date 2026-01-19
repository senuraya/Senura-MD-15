const { cmd } = require("../command");
const axios = require("axios");
const cheerio = require("cheerio");

cmd(
  {
    pattern: "cinesub",
    alias: ["cine", "msearch"],
    desc: "Search movies from Cinesubz using Internal API",
    category: "download",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("🎬 කරුණාකර චිත්‍රපටයේ නම ලබා දෙන්න.");

      await bot.sendMessage(from, { react: { text: "🔍", key: mek.key } });

      const scraperKey = "7114c6edc7fd34b555aaefde6946ec35";
      
      // 1. සයිට් එකේ Internal API එක හරහා සෙවීම
      const searchApiUrl = `https://cinesubz.net/wp-json/zetaflix/search/?keyword=${encodeURIComponent(q)}`;
      const proxyUrl = `http://api.scraperapi.com?api_key=${scraperKey}&url=${encodeURIComponent(searchApiUrl)}`;

      const res = await axios.get(proxyUrl);
      
      // ප්‍රතිඵල තිබේදැයි බැලීම
      if (!res.data || res.data.length === 0) {
          return reply("❌ Cinesubz හි එවැනි ප්‍රතිඵලයක් හමු නොවීය.");
      }

      // පළමු ප්‍රතිඵලය තෝරා ගැනීම
      const movie = res.data[0];
      const movieLink = movie.url;
      const title = movie.title;
      const img = movie.img;

      // 2. Movie Page එකට ගොස් විස්තර සහ Download Links ගැනීම
      const movieProxy = `http://api.scraperapi.com?api_key=${scraperKey}&url=${encodeURIComponent(movieLink)}&render=true`;
      const movieRes = await axios.get(movieProxy);
      const $ = cheerio.load(movieRes.data);

      const plot = $(".entry-content p").first().text().trim() || "විස්තරයක් ලබාගත නොහැක.";
      
      let downloadLinks = "\n🔗 *DOWNLOAD LINKS* 🔗\n\n";
      let hasLinks = false;

      $("a").each((i, el) => {
          const href = $(el).attr("href");
          if (href && (href.includes("pixeldrain.com") || href.includes("mega.nz"))) {
              const name = $(el).text().trim() || "Download";
              downloadLinks += `🚀 ${name}: ${href}\n\n`;
              hasLinks = true;
          }
      });

      // 3. Card එක සැකසීම
      let detailsMsg = `🅢🅔🅒🅡🅔🅣 🅜🅞🅥🅘🅔 🅒🅛🅤🅑 🅒🅘🅝🅔🅜 Cinema 🎦\n\n`;
      detailsMsg += `📌 *Title:* ${title}\n\n`;
      detailsMsg += `📝 *සාරාංශය:* \n${plot.substring(0, 350)}...\n\n`;
      detailsMsg += hasLinks ? downloadLinks : "⚠️ _සෘජු බාගත කිරීමේ ලින්ක් හමු නොවීය._\n\n";
      detailsMsg += `🌐 *Source:* ${movieLink}`;

      await bot.sendMessage(from, { 
          image: { url: img }, 
          caption: detailsMsg 
      }, { quoted: mek });

      await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      console.log("CINESUB API ERROR:", e.message);
      reply("❌ දත්ත ලබා ගැනීම තාවකාලිකව අසාර්ථකයි.");
    }
  }
);
