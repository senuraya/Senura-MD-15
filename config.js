const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID || "zc0iibhJ#wYL5oW9X5NDiYjRbf6dOwkjK0xbXcGOxobUkToZnfn0",
ALIVE_IMG: process.env.ALIVE_IMG || "https://github.com/senuraya/Senura_Md/blob/main/images/ChatGPT%20Image%20Aug%2019,%202025,%2005_22_42%20PM.png?raw=true",
ALIVE_MSG: process.env.ALIVE_MSG || "*Hello👋 SENURA-MD Is Alive Now😍*",
BOT_OWNER: '94776121326',  // Replace with the owner's phone number



};
