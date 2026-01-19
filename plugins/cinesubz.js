const { cmd } = require("../command");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

cmd(
  {
    pattern: "cine",
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
      
      // Google හරහා Cinesubz ලින්ක් එක සොයමු
      const searchTarget = `https://www.google.com/search?q=site:cinesubz.lk+${encodeURIComponent(q)}`;
      const searchProxyUrl = `http://api.scraperapi.com?api_key=${scraperKey}&url=${encodeURIComponent(searchTarget)}`;

      const { data: searchData } = await axios.get(searchProxyUrl);
      const $ = cheerio.load(searchData);
      
      let movieLink = "";
      $("a").each((i, el) => {
          const href = $(el).attr("href");
          if (href && href.includes("cinesubz.lk") && !href.includes("google.com")) {
              const match = href.match(/https?:\/\/cinesubz\.lk\/[^\/]+\//);
              if (match) {
                  movieLink = match[0];
                  return false; 
              }
          }
      });

      if (!movieLink) return reply("❌ Cinesubz අඩවියේ එවැනි චිත්‍රපටයක් හමු නොවීය.");

      // දැන් Movie Page එකට යමු - Render true සමඟ
      const movieProxyUrl = `http://api.scraperapi.com?api_key=${scraperKey}&url=${encodeURIComponent(movieLink)}&render=true`;
      const movieRes = await axios.get(movieProxyUrl);
      const $$ = cheerio.load(movieRes.data);

      const title = $$("h1").first().text().trim() || "Cinesubz Movie";
      const poster = $$("img.wp-post-image").attr("src") || $$("div.poster img").attr("src");
      const plot = $$(".entry-content p").first().text().trim() || "විස්තරයක් ලබාගත නොහැක.";

      // Download Links සොයමු
      let linksText = "🔗 *DOWNLOAD LINKS* 🔗\n\n";
      let hasLinks = false;

      $$("a").each((i, el) => {
          const href = $$(el).attr("href");
          if (href && (href.includes("pixeldrain.com") || href.includes("mega.nz"))) {
              const linkName = $$(el).text().trim() || "Download";
              linksText += `🚀 ${linkName}: ${href}\n\n`;
              hasLinks = true;
          }
      });

      let detailsMsg = `🅢🅔🅒🅡🅔🅣 🅜🅞🅥🅘🅔 🅒🅛🅤🅑 🅒🅘🅝🅔🅜 Cinema 🎦\n\n`;
      detailsMsg += `📌 *Title:* ${title}\n\n`;
      detailsMsg += `📝 *සාරාංශය:* \n${plot.substring(0, 350)}...\n\n`;
      detailsMsg += hasLinks ? linksText : "⚠️ _බාගත කිරීමේ ලින්ක් හමු නොවීය._\n\n";

      await bot.sendMessage(from, { image: { url: poster || 'https://via.placeholder.com/500' }, caption: detailsMsg }, { quoted: mek });
      await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      console.log("CINESUB ERROR:", e.message);
      reply("❌ දත්ත ලබා ගැනීම අසාර්ථකයි. පසුව උත්සාහ කරන්න.");
    }
  }
);
