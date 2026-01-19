const { cmd } = require("../command");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

cmd(
  {
    pattern: "cinesub",
    alias: ["cine", "msearch"],
    desc: "Search movies from Cinesubz (Updated Structure)",
    category: "download",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("🎬 කරුණාකර චිත්‍රපටයේ නම ලබා දෙන්න.");

      await bot.sendMessage(from, { react: { text: "🔍", key: mek.key } });

      const scraperKey = "7114c6edc7fd34b555aaefde6946ec35"; 
      
      // 1. Google හරහා සෙවීම (Cinesubz අලුත් domain එක වන .net/.co/ හරහා යාමට)
      const googleTarget = `https://www.google.com/search?q=site:cinesubz.net+OR+site:cinesubz.lk+${encodeURIComponent(q)}`;
      const searchProxyUrl = `http://api.scraperapi.com?api_key=${scraperKey}&url=${encodeURIComponent(googleTarget)}&render=true`;

      const { data: searchData } = await axios.get(searchProxyUrl);
      const $ = cheerio.load(searchData);
      
      let movieLink = "";
      $("a").each((i, el) => {
          const href = $(el).attr("href");
          if (href && (href.includes("cinesubz.net") || href.includes("cinesubz.lk")) && !href.includes("google.com")) {
              const match = href.match(/https?:\/\/cinesubz\.(net|lk|co)\/[^\/]+\//);
              if (match) {
                  movieLink = match[0];
                  return false; 
              }
          }
      });

      if (!movieLink) return reply("❌ Cinesubz අඩවියේ එවැනි චිත්‍රපටයක් හමු නොවීය.");

      // 2. අලුත් HTML Selectors වලට අනුව දත්ත ගැනීම
      const movieProxyUrl = `http://api.scraperapi.com?api_key=${scraperKey}&url=${encodeURIComponent(movieLink)}&render=true`;
      const { data: movieData } = await axios.get(movieProxyUrl);
      const $$ = cheerio.load(movieData);

      // සයිට් එකේ අලුත් හෙඩින් එක සහ පින්තූරය ගැනීම
      const title = $$("h1.entry-title").text().trim() || $$("title").text().split("–")[0].trim();
      const poster = $$("img.wp-post-image").attr("src") || $$("link[rel='shortcut icon']").attr("href");
      const plot = $$(".entry-content p").first().text().trim() || "විස්තරයක් ලබාගත නොහැක.";

      // 3. Pixeldrain/Mega ලින්ක් සොයා ගැනීම
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

      // 4. Card එක සැකසීම
      let detailsMsg = `🅢🅔🅒🅡🅔🅣 🅜🅞🅥🅘🅔 🅒🅛🅤🅑 🅒🅘🅝🅔🅜 Cinema 🎦\n\n`;
      detailsMsg += `📌 *Title:* ${title}\n\n`;
      detailsMsg += `📝 *සාරාංශය:* \n${plot.substring(0, 350)}...\n\n`;
      detailsMsg += hasLinks ? linksText : "⚠️ _බාගත කිරීමේ ලින්ක් හමු නොවීය._\n\n";
      detailsMsg += `🌐 *Source:* ${movieLink}\n`;

      // Footer
      if (fs.existsSync("./caption.txt")) {
        const footer = fs.readFileSync("./caption.txt", "utf8").replace(/{filename}|{size}/g, "").trim();
        detailsMsg += `\n---\n${footer}`;
      }

      await bot.sendMessage(from, { 
          image: { url: poster || 'https://via.placeholder.com/500' }, 
          caption: detailsMsg 
      }, { quoted: mek });

      await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      console.log("CINESUB ERROR:", e.message);
      reply(`❌ දත්ත ලබා ගැනීම අසාර්ථකයි: ${e.message}`);
    }
  }
);
