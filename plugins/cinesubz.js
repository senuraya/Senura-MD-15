const { cmd } = require("../command");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

cmd(
  {
    pattern: "cine",
    alias: ["cine", "msearch"],
    desc: "Search movies from Cinesubz using ScraperAPI",
    category: "download",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("🎬 කරුණාකර සෙවිය යුතු චිත්‍රපටයේ නම ලබා දෙන්න.");

      await bot.sendMessage(from, { react: { text: "🔍", key: mek.key } });

      // ඔයාගේ අලුත් ScraperAPI Key එක
      const scraperKey = "7114c6edc7fd34b555aaefde6946ec35"; 
      
      // 1. Search Step - Google හරහා Cinesubz ලින්ක් එක සෙවීම (වඩාත් සාර්ථක ක්‍රමය)
      const googleTarget = `https://www.google.com/search?q=site:cinesubz.lk+${encodeURIComponent(q)}`;
      const searchProxyUrl = `http://api.scraperapi.com?api_key=${scraperKey}&url=${encodeURIComponent(googleTarget)}&render=true`;

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

      // 2. Movie Page Scrape Step
      const movieProxyUrl = `http://api.scraperapi.com?api_key=${scraperKey}&url=${encodeURIComponent(movieLink)}&render=true`;
      const { data: movieData } = await axios.get(movieProxyUrl);
      const $$ = cheerio.load(movieData);

      const title = $$("h1.entry-title").text().trim() || "Cinesubz Movie";
      const poster = $$("img.wp-post-image").attr("src") || $$("div.poster img").attr("src");
      const plot = $$(".entry-content p").first().text().trim() || "විස්තරයක් ලබාගත නොහැක.";

      // 3. Download Links සොයා ගැනීම (Pixeldrain/Mega)
      let linksText = "🔗 *DOWNLOAD LINKS* 🔗\n\n";
      let hasLinks = false;

      $$("a").each((i, el) => {
          const href = $$(el).attr("href");
          if (href && (href.includes("pixeldrain.com") || href.includes("mega.nz"))) {
              const linkName = $$(el).text().trim() || "Download Link";
              linksText += `🚀 ${linkName}: ${href}\n\n`;
              hasLinks = true;
          }
      });

      // --- 4. Details Card එක සැකසීම ---
      let detailsMsg = `🅢🅔🅒🅡🅔🅣 🅜🅞🅥🅘🅔 🅒🅛🅤🅑 🅒🅘🅝🅔🅜 Cinema 🎦\n\n`;
      detailsMsg += `📌 *Title:* ${title}\n\n`;
      detailsMsg += `📝 *සාරාංශය:* \n${plot.substring(0, 350)}...\n\n`;
      
      if (hasLinks) {
          detailsMsg += linksText;
      } else {
          detailsMsg += "⚠️ _සෘජු බාගත කිරීමේ ලින්ක් හමු නොවීය._\n\n";
      }

      detailsMsg += `🌐 *Source:* ${movieLink}\n`;

      // Footer
      if (fs.existsSync("./caption.txt")) {
        const footerCaption = fs.readFileSync("./caption.txt", "utf8");
        const cleanFooter = footerCaption.replace(/{filename}/g, "").replace(/{size}/g, "").trim();
        detailsMsg += `\n---\n${cleanFooter}`;
      }

      await bot.sendMessage(from, { image: { url: poster || 'https://via.placeholder.com/500' }, caption: detailsMsg }, { quoted: mek });
      await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      console.log("SCRAPER ERROR:", e.message);
      reply("❌ දත්ත ලබා ගැනීම අසාර්ථකයි. ScraperAPI ලිමිට් එක පරීක්ෂා කරන්න.");
    }
  }
);
