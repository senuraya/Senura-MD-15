const { cmd } = require("../command");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

cmd(
  {
    pattern: "cinesub",
    alias: ["cine", "msearch"],
    desc: "Search movies from Cinesubz.lk",
    category: "download",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("🎬 කරුණාකර චිත්‍රපටයේ නම ලබා දෙන්න. (උදා: .cinesub Leo)");

      await bot.sendMessage(from, { react: { text: "🔍", key: mek.key } });

      // Google හරහා Cinesubz සෙවීම
      const searchUrl = `https://www.google.com/search?q=site:cinesubz.lk+${encodeURIComponent(q)}`;
      const { data } = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        }
      });

      const $ = cheerio.load(data);
      let movieLink = "";

      // පළමු Cinesubz ලින්ක් එක සොයා ගැනීම
      $("a").each((i, el) => {
        const href = $(el).attr("href");
        if (href && href.includes("cinesubz.lk") && !href.includes("google.com")) {
          const match = href.match(/https?:\/\/cinesubz\.lk\/[^\/]+\//);
          if (match) {
            movieLink = match[0];
            return false; // loop එක නවත්වන්න
          }
        }
      });

      if (!movieLink) return reply("❌ Cinesubz අඩවියේ එවැනි චිත්‍රපටයක් හමු නොවීය.");

      // සොයාගත් ලින්ක් එකට ගොස් විස්තර ලබා ගැනීම
      const moviePage = await axios.get(movieLink);
      const $$ = cheerio.load(moviePage.data);

      const title = $$("h1.entry-title").text().trim() || "Movie Found";
      const poster = $$("img.wp-post-image").attr("src");
      const plot = $$(".entry-content p").first().text().trim();

      // --- Card එක සැකසීම ---
      let detailsMsg = `🅢🅔🅒🅡🅔🅣 🅜🅞🅥🅘🅔 🅒🅛🅤🅑 🅒🅘🅝🅔🅜🅐 🎦\n\n`;
      detailsMsg += `📌 *Title:* ${title}\n\n`;
      detailsMsg += `📝 *සාරාංශය:* \n${plot.substring(0, 300)}...\n\n`;
      detailsMsg += `🔗 *Cinesubz Link:* ${movieLink}\n\n`;

      // Footer (.apply එකෙන් එන එක)
      if (fs.existsSync("./caption.txt")) {
        const footerCaption = fs.readFileSync("./caption.txt", "utf8");
        const cleanFooter = footerCaption.replace(/{filename}/g, "").replace(/{size}/g, "").trim();
        detailsMsg += `---\n${cleanFooter}`;
      }

      // Card එක යැවීම
      await bot.sendMessage(
        from,
        {
          image: { url: poster || 'https://via.placeholder.com/500' },
          caption: detailsMsg,
        },
        { quoted: mek }
      );

      await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      console.log("CINESUB ERROR:", e.message);
      reply("❌ සෙවීමේදී දෝෂයක් සිදු විය. පසුව උත්සාහ කරන්න.");
    }
  }
);
