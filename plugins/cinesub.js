const { cmd } = require("../command");
const axios = require("axios");

cmd(
  {
    pattern: "cinesub",
    alias: ["movie", "flic"],
    desc: "Search movies using WP API",
    category: "download",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("🎬 කරුණාකර චිත්‍රපටයේ නම ලබා දෙන්න.");

      await bot.sendMessage(from, { react: { text: "🔍", key: mek.key } });

      // WordPress API එක හරහා සෙවීම (Cinesub WP පාවිච්චි කරයි නම්)
      const apiUrl = `https://cinesub.lk/wp-json/wp/v2/posts?search=${encodeURIComponent(q)}&_embed`;
      
      const response = await axios.get(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });

      const data = response.data;

      if (!data || data.length === 0) {
        await bot.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ කිසිදු ප්‍රතිඵලයක් හමු නොවීය.");
      }

      // පළමු ප්‍රතිඵලය ලබා ගැනීම
      const movie = data[0];
      const title = movie.title.rendered;
      const link = movie.link;
      // Featured Image එක ලබා ගැනීම
      const image = movie._embedded?.['wp:featuredmedia']?.[0]?.source_url || 'https://via.placeholder.com/500';

      let caption = `🎬 *${title}*\n\n`;
      caption += `🔗 *Link:* ${link}\n\n`;
      caption += `💡 *Download:* .download [direct_link]`;

      await bot.sendMessage(
        from,
        {
          image: { url: image },
          caption: caption,
        },
        { quoted: mek }
      );

      await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      console.log("CINESUB API ERROR:", e.message);
      
      // API එකත් වැඩ නැත්නම් සාමාන්‍ය වෙබ් පිටුවෙන් නැවත උත්සාහ කරන්න (Backup method)
      reply("⚠️ API Error එකක් ආවා. සයිට් එකේ ආරක්ෂක පද්ධතිය මගින් බ්ලොක් කරනවා විය හැක. වෙනත් මූවී සයිට් එකක් (උදා: Baiscope) මේ විදිහටම හදන්නද?");
    }
  }
);
