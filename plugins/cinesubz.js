const { cmd } = require("../command");
const puppeteer = require("puppeteer");

const pendingCineSearch = {};
const pendingCineQuality = {};

// අකුරු නිවැරදි කිරීම (Quality Normalization)
function normalizeQuality(text) {
  if (!text) return "HD";
  text = text.toUpperCase();
  if (text.includes("1080")) return "1080p";
  if (text.includes("720")) return "720p";
  if (text.includes("480")) return "480p";
  return text;
}

// 1. සෙවීමේ ක්‍රියාවලිය (Search)
async function searchCineMovies(query) {
  const searchUrl = `https://cinesubz.co/?s=${encodeURIComponent(query)}`;
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.goto(searchUrl, { waitUntil: "networkidle2" });

  const results = await page.$$eval("article.item-movies", articles =>
    articles.slice(0, 10).map((art, index) => {
      const a = art.querySelector(".data h3 a");
      const img = art.querySelector(".poster img");
      return {
        id: index + 1,
        title: a?.textContent?.trim() || "",
        movieUrl: a?.href || "",
        thumb: img?.src || "",
      };
    }).filter(m => m.title && m.movieUrl)
  );
  await browser.close();
  return results;
}

// 2. ඩවුන්ලෝඩ් ලින්ක් ලබාගැනීම (Link Extraction)
async function getCineDownloadLinks(movieUrl) {
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.goto(movieUrl, { waitUntil: "networkidle2" });

  // Cinesubz හි ඇති 'Download Movie' හෝ අදාළ බටන් එක සොයාගැනීම
  const links = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.links_table tbody tr'));
    return rows.map(row => {
      const linkBtn = row.querySelector('a.button');
      const quality = row.querySelector('strong')?.textContent || "HD";
      const size = row.cells[2]?.textContent || "Unknown";
      return { 
        url: linkBtn?.href, 
        quality: quality.trim(),
        size: size.trim()
      };
    }).filter(l => l.url);
  });

  const finalLinks = [];
  for (const l of links) {
    try {
      const subPage = await browser.newPage();
      await subPage.goto(l.url, { waitUntil: "networkidle2" });
      
      // තත්පර 5-8 ක් රැඳී සිටීම (Redirects සිදු වීමට)
      await new Promise(r => setTimeout(r, 6000)); 

      // Pixeldrain හෝ Direct ලින්ක් එක තිබේදැයි බැලීම
      const directUrl = await subPage.evaluate(() => {
          const a = document.querySelector('a[href*="pixeldrain.com"], a[href*="direct-link-pattern"]');
          return a ? a.href : null;
      });

      if (directUrl) {
          finalLinks.push({ 
            link: directUrl.replace("/u/", "/api/file/") + "?download", 
            quality: l.quality, 
            size: l.size 
          });
      }
      await subPage.close();
    } catch (e) { continue; }
  }

  await browser.close();
  return finalLinks;
}

// Commands
cmd({
  pattern: "cine",
  react: "🎬",
  desc: "Cinesubz Movie Downloader",
  category: "download",
  filename: __filename
}, async (conn, mek, m, { from, q, sender, reply }) => {
  if (!q) return reply("*🎥 Cinesubz Search*\n\nUsage: .cine Avengers");
  reply("*🔍 Searching Cinesubz...*");

  const results = await searchCineMovies(q);
  if (!results.length) return reply("*❌ No movies found!*");

  pendingCineSearch[sender] = { results, timestamp: Date.now() };

  let txt = "*🎬 Cinesubz Results:*\n\n";
  results.forEach((v, i) => txt += `*${i+1}.* ${v.title}\n`);
  txt += `\n*Reply with the number to get details.*`;
  reply(txt);
});

// Selection Handler (Simplified)
cmd({
  filter: (text, { sender }) => pendingCineSearch[sender] && !isNaN(text)
}, async (conn, mek, m, { body, sender, reply, from }) => {
  const index = parseInt(body) - 1;
  const selected = pendingCineSearch[sender].results[index];
  delete pendingCineSearch[sender];

  reply("*🔗 Extracting Download Links... This may take a minute.*");
  const dlLinks = await getCineDownloadLinks(selected.movieUrl);

  if (!dlLinks.length) return reply("*❌ No direct links found!*");

  let dlMsg = `*🎬 ${selected.title}*\n\n*Available Qualities:*\n`;
  dlLinks.forEach((d, i) => dlMsg += `*${i+1}.* ${d.quality} (${d.size})\n`);
  
  // මෙහිදී direct download එක document එකක් ලෙස යැවීමට ඉහත ඔබ දුන් logic එකම භාවිතා කළ හැක.
  reply(dlMsg);
});
