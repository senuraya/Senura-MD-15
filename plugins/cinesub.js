const { cmd } = require("../command");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

cmd(
  {
    pattern: "cinesub",
    alias: ["cine", "msearch"],
    desc: "Search movies from Cinesubz using ScraperAPI",
    category: "download",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("🎬 කරුණාකර සෙවිය යුතු චිත්‍රපටයේ නම ලබා දෙන්න.");

      await bot.sendMessage(from, { react: { text: "🔍", key: mek.key } });

      const scraperKey = "7114c6edc7fd34b555aaefde6946ec35"; 
      
      // 1. Google හරහා සෙවීම (URL එකේ වැරදි මඟහරවා ගැනීමට)
      const googleTarget = `https://www.google.com/search?q=site:cinesubz.lk+${encodeURIComponent(q)}`;
      const searchProxyUrl = `http://api.scraperapi.com?api_key=${scraperKey}&url=${encodeURIComponent(googleTarget)}&render=true`;

      const searchRes = await axios.get(searchProxyUrl);
      const $ = cheerio.load(searchRes.data);
      
      let movieLink = "";
      
      // Google search results වලින් Cinesubz ලින්ක් එක නිවැරදිව හඳුනා ගැනීම
      $("a").each((i, el) => {
          const href = $(el).attr("href");
          if (href && href.includes("cinesubz.lk") && !href.includes("google.com")) {
              // අනවශ්‍ය පරාමිතීන් ඉවත් කර පිරිසිදු ලින්ක් එක ගැනීම
              const match = href.match(/https?:\/\/cinesubz\.lk\/[^\/]+\//);
              if (match) {
                  movieLink = match[0];
                  return false; 
              }
          }
      });

      // ලින්ක් එකක් හමු නොවුණහොත් 404 වීමට පෙර මෙතැනින් නවත්වනවා
      if (!movieLink) return reply("❌ Cinesubz අඩවියේ එවැනි චිත්‍රපටයක් හමු නොවීය.");

      // 2. Movie Page එකෙන් දත්ත ගැනීම
      const movieProxyUrl = `http://api.scraperapi.com?api_key=${scraperKey}&url=${encodeURIComponent(movieLink)}&render=true`;
      const movieRes = await axios.get(movieProxyUrl);
      const $$ = cheerio.load(movieRes.data);

      const title = $$("h1.entry-title").text().trim() || "Cinesubz Movie";
      const poster = $$("img.wp-post-image").attr("src") || $$("div.poster img").attr("src");
      const plot = $$(".entry-content p").first().text().trim() || "විස්තරයක් ලබාගත නොහැක.";

      // Download Links සොයා ගැනීම
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

      // Details Card එක සැකසීම
      let detailsMsg = `🅢🅔🅒🅡🅔🅣 🅜🅞🅥🅘🅔 🅒🅛🅤🅑 🅒🅘🅝🅔🅜 Cinema 🎦\n\n`;
      detailsMsg += `📌 *Title:* ${title}\n\n`;
      detailsMsg += `📝 *සාරාංශය:* \n${plot.substring(0, 350)}...\n\n`;
      detailsMsg += hasLinks ? linksText : "⚠️ _බාගත කිරීමේ ලින්ක් හමු නොවීය._\n\n";

      await bot.sendMessage(from, { 
          image: { url: poster || 'https://via.placeholder.com/500' }, 
          caption: detailsMsg 
      }, { quoted: mek });

      await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      console.log("CINESUB ERROR:", e.message);
      // මෙහිදී Error එක පැහැදිලිව පෙන්වනවා
      reply(`❌ දත්ත ලබා ගැනීම අසාර්ථකයි: ${e.message}`);
    }
  }
);
