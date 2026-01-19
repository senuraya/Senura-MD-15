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

      const scraperKey = "ඔයාගේ_SCRAPER_API_KEY_එක";
      
      // ScraperAPI හරහා Cinesubz Search කරන URL එක
      const searchTarget = `https://cinesubz.lk/?s=${encodeURIComponent(q)}`;
      const searchProxyUrl = `http://api.scraperapi.com?api_key=${scraperKey}&url=${encodeURIComponent(searchTarget)}`;

      const { data: searchData } = await axios.get(searchProxyUrl);
      const $ = cheerio.load(searchData);
      
      // ZetaFlix theme එකේ movie item එක සොයා ගැනීම
      const firstMovie = $("article.item").first();
      const movieLink = firstMovie.find("a").attr("href");

      if (!movieLink) return reply("❌ කිසිදු චිත්‍රපටයක් හමු නොවීය.");

      // ScraperAPI හරහා Movie Page එකට පිවිසීම
      const movieProxyUrl = `http://api.scraperapi.com?api_key=${scraperKey}&url=${encodeURIComponent(movieLink)}`;
      const { data: movieData } = await axios.get(movieProxyUrl);
      const $$ = cheerio.load(movieData);

      const title = $$("h1.entry-title").text().trim();
      const poster = $$("img.wp-post-image").attr("src");
      const plot = $$(".entry-content p").first().text().trim();

      // Download Links (Pixeldrain/Mega) සොයා ගැනීම
      let linksText = "🔗 *DOWNLOAD LINKS* 🔗\n\n";
      let hasLinks = false;

      $$("a").each((i, el) => {
          const href = $$(el).attr("href");
          if (href && (href.includes("pixeldrain") || href.includes("mega.nz"))) {
              const linkName = $$(el).text().trim() || "Download";
              linksText += `🚀 ${linkName}: ${href}\n`;
              hasLinks = true;
          }
      });

      // --- Card එක සැකසීම ---
      let detailsMsg = `🅢🅔🅒🅡🅔🅣 🅜🅞🅥🅘🅔 🅒🅛🅤🅑 🅒🅘🅝🅔🅜 Cinema 🎦\n\n`;
      detailsMsg += `📌 *Title:* ${title}\n\n`;
      detailsMsg += `📝 *සාරාංශය:* \n${plot.substring(0, 300)}...\n\n`;
      detailsMsg += hasLinks ? linksText : "_සෘජු ලින්ක් හමු නොවීය. සයිට් එකේ Button එකක් තිබේදැයි බලන්න._\n";

      // Footer (.apply එකෙන් එන එක)
      if (fs.existsSync("./caption.txt")) {
        const footerCaption = fs.readFileSync("./caption.txt", "utf8");
        const cleanFooter = footerCaption.replace(/{filename}/g, "").replace(/{size}/g, "").trim();
        detailsMsg += `\n---\n${cleanFooter}`;
      }

      await bot.sendMessage(
        from,
        {
          image: { url: poster },
          caption: detailsMsg,
        },
        { quoted: mek }
      );

      await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      console.log("SCRAPER ERROR:", e.message);
      reply("❌ දත්ත ලබා ගැනීම අසාර්ථකයි. ScraperAPI Key එක පරීක්ෂා කරන්න.");
    }
  }
);
