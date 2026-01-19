const { cmd } = require("../command");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

cmd(
  {
    pattern: "cine",
    alias: ["cine", "msearch"],
    desc: "Search movies from Cinesubz using improved logic",
    category: "download",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("🎬 කරුණාකර සෙවිය යුතු චිත්‍රපටයේ නම ලබා දෙන්න.");

      await bot.sendMessage(from, { react: { text: "🔍", key: mek.key } });

      const scraperKey = "ඔයාගේ_SCRAPER_API_KEY_එක";
      
      // ක්‍රමය 1: සෘජුවම Cinesubz සෙවුම (ScraperAPI හරහා render කරමින්)
      const searchTarget = `https://cinesubz.lk/?s=${encodeURIComponent(q)}`;
      const searchProxyUrl = `http://api.scraperapi.com?api_key=${scraperKey}&url=${encodeURIComponent(searchTarget)}&render=true`;

      const { data: searchData } = await axios.get(searchProxyUrl);
      const $ = cheerio.load(searchData);
      
      // ZetaFlix හෝ වෙනත් ඕනෑම Article එකක් සෙවීම
      let movieLink = $("article a").first().attr("href") || $("h2.entry-title a").first().attr("href");

      if (!movieLink) {
          // ක්‍රමය 2: Google හරහා Cinesubz ලින්ක් එක සෙවීම (Backup method)
          const googleTarget = `https://www.google.com/search?q=site:cinesubz.lk+${encodeURIComponent(q)}`;
          const googleProxy = `http://api.scraperapi.com?api_key=${scraperKey}&url=${encodeURIComponent(googleTarget)}`;
          const { data: gData } = await axios.get(googleProxy);
          const $g = cheerio.load(gData);
          
          $g("a").each((i, el) => {
              const href = $g(el).attr("href");
              if (href && href.includes("cinesubz.lk") && !href.includes("google.com")) {
                  movieLink = href.match(/https?:\/\/cinesubz\.lk\/[^\/]+\//)?.[0];
                  if (movieLink) return false;
              }
          });
      }

      if (!movieLink) return reply("❌ කිසිදු ප්‍රතිඵලයක් හමු නොවීය. නම නිවැරදිදැයි නැවත පරීක්ෂා කරන්න.");

      // Movie Page එකට පිවිසීම
      const movieProxyUrl = `http://api.scraperapi.com?api_key=${scraperKey}&url=${encodeURIComponent(movieLink)}&render=true`;
      const { data: movieData } = await axios.get(movieProxyUrl);
      const $$ = cheerio.load(movieData);

      const title = $$("h1").first().text().trim();
      const poster = $$("img.wp-post-image").attr("src") || $$("div.poster img").attr("src");
      const plot = $$(".entry-content p").first().text().trim();

      let detailsMsg = `🅢🅔🅒🅡🅔🅣 🅜🅞🅥🅘🅔 🅒🅛🅤🅑 🅒🅘🅝🅔🅜 Cinema 🎦\n\n`;
      detailsMsg += `📌 *Title:* ${title}\n\n`;
      detailsMsg += `📝 *සාරාංශය:* \n${plot.substring(0, 300)}...\n\n`;
      detailsMsg += `🌐 *Link:* ${movieLink}\n`;

      if (fs.existsSync("./caption.txt")) {
        const footerCaption = fs.readFileSync("./caption.txt", "utf8");
        const cleanFooter = footerCaption.replace(/{filename}/g, "").replace(/{size}/g, "").trim();
        detailsMsg += `\n---\n${cleanFooter}`;
      }

      await bot.sendMessage(from, { image: { url: poster }, caption: detailsMsg }, { quoted: mek });
      await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      console.log("SCRAPER ERROR:", e.message);
      reply("❌ දෝෂයක් සිදු විය. ScraperAPI ලිමිට් එක අවසන් වී ඇත්දැයි බලන්න.");
    }
  }
);
