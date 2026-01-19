const { cmd } = require("../command");
const axios = require("axios");
const cheerio = require("cheerio");

cmd(
  {
    pattern: "cinesub",
    desc: "Scrap movies from Cinesubz",
    category: "download",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("🎬 කරුණාකර චිත්‍රපටයේ නම ලබා දෙන්න.");

      const scraperKey = "b69853dfa914fe088de139986c69469b"; // මෙතනට අලුත් Key එක දාන්න
      
      // Google හරහා Cinesubz ලින්ක් එක සෙවීම (වඩාත් ආරක්ෂිතයි)
      const googleUrl = `https://www.google.com/search?q=site:cinesubz.lk+${encodeURIComponent(q)}`;
      const searchProxy = `http://api.scraperapi.com?api_key=${scraperKey}&url=${encodeURIComponent(googleUrl)}&render=true`;

      const { data: searchData } = await axios.get(searchProxy);
      const $ = cheerio.load(searchData);
      
      let movieLink = "";
      $("a").each((i, el) => {
          const href = $(el).attr("href");
          if (href && href.includes("cinesubz.lk") && !href.includes("google.com")) {
              const match = href.match(/https?:\/\/cinesubz\.lk\/[^\/]+\//);
              if (match) { movieLink = match[0]; return false; }
          }
      });

      if (!movieLink) return reply("❌ කිසිදු ප්‍රතිඵලයක් හමු නොවීය.");

      // මූවී පිටුව Scrap කිරීම
      const movieProxy = `http://api.scraperapi.com?api_key=${scraperKey}&url=${encodeURIComponent(movieLink)}&render=true`;
      const { data: movieData } = await axios.get(movieProxy);
      const $$ = cheerio.load(movieData);

      const title = $$("h1.entry-title").text().trim();
      const poster = $$("img.wp-post-image").attr("src");
      const plot = $$(".entry-content p").first().text().trim();

      let details = `🎬 *${title}*\n\n📝 ${plot}\n\n🌐 *Source:* ${movieLink}`;

      await bot.sendMessage(from, { image: { url: poster }, caption: details }, { quoted: mek });

    } catch (e) {
      reply("❌ Scrap කිරීමේ දෝෂයක්: " + e.message);
    }
  }
);
