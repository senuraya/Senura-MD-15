const { cmd } = require("../command");

cmd(
  {
    pattern: "jid",
    desc: "Get current chat/user JID",
    category: "main",
    filename: __filename,
  },
  async (bot, mek, m, { from, reply }) => {
    reply(`🆔 *Current JID:* \n\n${from}`);
  }
);
