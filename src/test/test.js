const ShenaniBot = require('../bot/index');
const botOptions = require('../config/config');

const bot = new ShenaniBot(botOptions);

(async function test() {
  console.log(await bot.command('!help', true));
})();