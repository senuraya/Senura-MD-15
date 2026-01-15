const { cmd } = require("../command");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const pendingCineSearch = {};

// 1. සෙවීමේ ක්‍රියාවලිය
async function searchCineMovies(query) {
    const browser = await puppeteer.launch({ 
        headless: true, 
        args: ["--no-sandbox", "--disable-setuid-sandbox"] 
    });
    const page = await browser.newPage();
    try {
        await page.goto(`https://cinesubz.co/?s=${encodeURIComponent(query)}`, { waitUntil: "networkidle2" });
        const results = await page.$$eval("article.item-movies", articles =>
            articles.slice(0, 10).map((art, index) => {
                const a = art.querySelector(".data h3 a");
                return {
                    id: index + 1,
                    title: a?.textContent?.trim() || "",
                    movieUrl: a?.href || ""
                };
            }).filter(m => m.title && m.movieUrl)
        );
        await browser.close();
        return results;
    } catch (e) {
        await browser.close();
        return [];
    }
}

// 2. ඩවුන්ලෝඩ් ලින්ක් ලබාගැනීම
async function getCineLinks(url) {
    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
    const page = await browser.newPage();
    try {
        await page.goto(url, { waitUntil: "networkidle2" });
        const dlLinks = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('.links_table tbody tr'));
            return rows.map(row => ({
                quality: row.querySelector('strong')?.textContent.trim() || "HD",
                size: row.cells[2]?.textContent.trim() || "N/A",
                url: row.querySelector('a.button')?.href
            })).filter(l => l.url);
        });
        await browser.close();
        return dlLinks;
    } catch (e) {
        await browser.close();
        return [];
    }
}

// --- Commands ---

cmd({
    pattern: "cine",
    react: "🎬",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, sender, reply }) => {
    if (!q) return reply("චිත්‍රපටයේ නම ඇතුළත් කරන්න. උදා: .cine Joker");
    reply("🔍 Cinesubz හි සොයමින් පවතී...");
    
    const results = await searchCineMovies(q);
    if (results.length === 0) return reply("❌ කිසිවක් හමු වූයේ නැත.");

    pendingCineSearch[sender] = { results, timestamp: Date.now() };
    let msg = "*🎬 CINESUBZ SEARCH RESULTS*\n\n";
    results.forEach((res, i) => msg += `*${i+1}.* ${res.title}\n`);
    msg += "\nඅංකය Reply කර ලින්ක් ලබාගන්න.";
    reply(msg);
});

cmd({
    filter: (text, { sender }) => pendingCineSearch[sender] && !isNaN(text)
}, async (conn, mek, m, { body, sender, reply, from }) => {
    const index = parseInt(body) - 1;
    const selected = pendingCineSearch[sender].results[index];
    if (!selected) return;
    
    delete pendingCineSearch[sender];
    reply("🔗 ලින්ක් ලබාගනිමින් පවතී, මොහොතක් රැඳී සිටින්න...");
    
    const links = await getCineLinks(selected.movieUrl);
    if (links.length === 0) return reply("❌ ලින්ක් හමු වූයේ නැත.");

    let dlMsg = `*🎬 ${selected.title}*\n\n*Download Links:*\n`;
    links.forEach((l, i) => {
        dlMsg += `\n*${i+1}. Quality:* ${l.quality}\n*Size:* ${l.size}\n*URL:* ${l.url}\n`;
    });
    reply(dlMsg);
});
