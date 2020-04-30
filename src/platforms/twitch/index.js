const tmi = require('tmi.js');
const rumpus = require('@bscotch/rumpus-ce');
const ShenaniBot = require('../../bot/index');
const env = require('../../options');

const options = {
  options: {
    debug: true
  },
  connection: {
    reconnect: true
  },
  identity: {
    username: env.auth.botUsername,
    password: env.auth.oauthToken
  },
  channels: [env.auth.channel]
};

const rce = new rumpus.RumpusCE(env.auth.delegationToken);
const client = tmi.Client(options);
const shenanibot = new ShenaniBot(rce, env.config);

(async function main() {
  // Connect bot to server
  client.connect();
  console.log('Don\'t worry if it says \'Error: No response from twitch\', it should still work!');
  
  client.on('connected', (address, port) => {
    client.action(env.auth.channel, 'Bot Connected!');
  });

  client.on('chat', async (channel, user, message, self) => {
    if (self) return;

    (async function command() {
      let response = await shenanibot.command(message, user.username);
      client.say(env.auth.channel, response);
    })();
  });
})();
