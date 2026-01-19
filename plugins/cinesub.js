const { cmd } = require("../command");
const axios = require("axios");
const cheerio = require("cheerio");

cmd(
  {
    pattern: "cinesub",
    alias: ["cine", "msearch"],
    desc: "Direct search from Cinesubz",
    category: "download",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("🎬 කරුණාකර මූවී එකේ නම ලබා දෙන්න.");

      await bot.sendMessage(from, { react: { text: "🔍", key: mek.key } });

      // Cinesubz Search URL - සෘජුවම සයිට් එකට Request එකක් යවමු
      const searchUrl = `https://cinesubz.net/?s=${encodeURIComponent(q)}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 10000 // තත්පර 10ක් ඇතුළත රෙස්පොන්ස් එකක් ආවේ නැත්නම් නවත්වනවා
      });

      const $ = cheerio.load(response.data);
      
      // සයිට් එකේ ඇතුළේ තියෙන පළමු මූවී එකේ ලින්ක් එක සොයමු
      let movieLink = $("article a").first().attr("href") || $(".result-item a").first().attr("href");

      if (!movieLink) {
          return reply("❌ Cinesubz හි එවැනි ප්‍රතිඵලයක් හමු නොවීය. කරුණාකර නම නිවැරදිදැයි බලන්න.");
      }

      // Movie Page එකට ගොස් දත්ත ගැනීම
      const moviePage = await axios.get(movieLink, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const $$ = cheerio.load(moviePage.data);

      const title = $$("h1.entry-title").text().trim() || $$("title").text().split("–")[0].trim();
      const poster = $$("img.wp-post-image").attr("src");
      const plot = $$(".entry-content p").first().text().trim() || "විස්තරයක් ලබාගත නොහැක.";

      let downloadLinks = "\n🔗 *DOWNLOAD LINKS* 🔗\n\n";
      let hasLinks = false;

      $$("a").each((i, el) => {
          const href = $$(el).attr("href");
          if (href && (href.includes("pixeldrain.com") || href.includes("mega.nz"))) {
              const name = $$(el).text().trim() || "Download";
              downloadLinks += `🚀 ${name}: ${href}\n\n`;
              hasLinks = true;
          }
      });

      let detailsMsg = `🅢🅔🅒🅡🅔🅣 🅜🅞🅥🅘🅔 🅒🅛🅤🅑 🅒🅘🅝🅔🅜 Cinema 🎦\n\n`;
      detailsMsg += `📌 *Title:* ${title}\n\n`;
      detailsMsg += `📝 *සාරාංශය:* \n${plot.substring(0, 350)}...\n\n`;
      detailsMsg += hasLinks ? downloadLinks : "⚠️ _බාගත කිරීමේ ලින්ක් හමු නොවීය._\n\n";
      detailsMsg += `🌐 *Source:* ${movieLink}`;

      await bot.sendMessage(from, { 
          image: { url: poster || 'https://via.placeholder.com/500' }, 
          caption: detailsMsg 
      }, { quoted: mek });

      await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      console.log("CINESUB ERROR:", e); // Terminal එකේ Error එක බලන්න පුළුවන්
      if (e.response && e.response.status === 403) {
          return reply("❌ Cinesubz විසින් බොට්ව බ්ලොක් කර ඇත (Cloudflare 403 Error).");
      }
      reply("❌ දත්ත ලබා ගැනීම අසාර්ථකයි. පසුව උත්සාහ කරන්න.");
    }
  }
);
