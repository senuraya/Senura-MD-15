const { cmd } = require("../command");
const axios = require("axios");
const cheerio = require("cheerio");

const pendingCine = {};

// 1. සෙවුම් කාර්යය
async function searchCine(q) {
    try {
        const res = await axios.get(`https://cinesubz.co/?s=${encodeURIComponent(q)}`);
        const $ = cheerio.load(res.data);
        const results = [];
        $("article.item-movies").each((i, el) => {
            if (i < 10) {
                results.push({
                    title: $(el).find(".data h3 a").text().trim(),
                    url: $(el).find(".data h3 a").attr("href"),
                });
            }
        });
        return results;
    } catch (e) { return []; }
}

// 2. Direct Link එක Extract කිරීම (Bypass Logic)
async function getDirectLink(pageUrl) {
    try {
        // පළමු පිටුව (Movie Page)
        const res1 = await axios.get(pageUrl);
        const $1 = cheerio.load(res1.data);
        const links = [];

        const rows = $1(".links_table tbody tr");
        for (let i = 0; i < rows.length; i++) {
            const el = rows[i];
            const quality = $1(el).find("strong").text().trim();
            const size = $1(el).find("td").eq(2).text().trim();
            const redirectUrl = $1(el).find("a.button").attr("href");

            if (redirectUrl) {
                // දෙවන පිටුව (Download/Redirect Page)
                const res2 = await axios.get(redirectUrl);
                const $2 = cheerio.load(res2.data);
                
                // Pixeldrain ලින්ක් එක සොයාගැනීම
                const finalUrl = $2('a[href*="pixeldrain.com"]').attr("href");

                if (finalUrl) {
                    // Pixeldrain URL එක Direct Download URL එකක් බවට පත් කිරීම
                    // https://pixeldrain.com/u/xxxxx -> https://pixeldrain.com/api/file/xxxxx?download
                    const directDownload = finalUrl.replace("/u/", "/api/file/") + "?download";
                    links.push({ quality, size, url: directDownload });
                }
            }
        }
        return links;
    } catch (e) { return []; }
}

// --- Commands ---

cmd({
    pattern: "cine",
    react: "🎥",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, sender, reply }) => {
    if (!q) return reply("*🎥 Cinesubz Downloader*\n\nභාවිතය: .cine [නම]");
    reply("🔍 සොයමින් පවතී...");
    const results = await searchCine(q);
    if (results.length === 0) return reply("❌ ප්‍රතිඵල හමු වූයේ නැත.");

    pendingCine[sender] = { results, timestamp: Date.now() };
    let msg = "*🎬 CINESUBZ RESULTS*\n\n";
    results.forEach((res, i) => msg += `*${i+1}.* ${res.title}\n`);
    msg += "\n*අංකය Reply කර චිත්‍රපටය ලබාගන්න.*";
    reply(msg);
});

cmd({
    filter: (text, { sender }) => pendingCine[sender] && !isNaN(text)
}, async (conn, mek, m, { body, sender, reply, from }) => {
    const index = parseInt(body) - 1;
    const selected = pendingCine[sender].results[index];
    if (!selected) return;

    delete pendingCine[sender];
    reply(`🔗 *${selected.title}* සඳහා ලින්ක් සකසමින් පවතී. මොහොතක් රැඳී සිටින්න...`);

    const dlLinks = await getDirectLink(selected.url);
    if (dlLinks.length === 0) return reply("❌ සෘජු ලින්ක් හමු වූයේ නැත.");

    // පළමු ලින්ක් එක (සාමාන්‍යයෙන් හොඳම quality එක) යැවීම හෝ ලැයිස්තුව පෙන්වීම
    const bestLink = dlLinks[0];
    
    reply(`⬇️ *පොඩ්ඩක් ඉන්න..* මම ඔයාට ${bestLink.quality} quality එකෙන් චිත්‍රපටය එවන්නම්.`);

    try {
        await conn.sendMessage(from, {
            document: { url: bestLink.url },
            mimetype: "video/mp4",
            fileName: `${selected.title}.mp4`,
            caption: `*🎬 ${selected.title}*\n\n*📊 Quality:* ${bestLink.quality}\n*💾 Size:* ${bestLink.size}\n\n*Enjoy! 🍿*`
        }, { quoted: mek });
    } catch (err) {
        reply("❌ ගොනුව යැවීමේදී දෝෂයක් ඇති විය: " + err.message);
    }
});
