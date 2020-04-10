// not ready yet, as the bot only does messages through tmi
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (input) => {
  shenanibot.command()
});