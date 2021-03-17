const TMI = require('tmi.js');
const ShenaniBot = require('../../bot/index');
const pb = require('@madelsberger/pausebuffer');
const httpServer = require('../../web/server');
const configLoader = require('../../config/loader');

const params = configLoader.load();

process.on('SIGINT', function() {
  process.exit(1);
});

if (params.config.httpPort) {
  httpServer.start(params.config);
}

const options = {
  options: {
    debug: true
  },
  connection: {
    reconnect: true
  },
  identity: {
    username: params.auth.botUsername,
    password: params.auth.oauthToken
  },
  channels: [params.auth.channel]
};

const _client = TMI.Client(options);
const client = params.config.useThrottle ? pb.wrap(_client) : _client;
const shenanibot = new ShenaniBot(params);

(async function main() {
  // Connect bot to server
  client.connect();
  console.log('Don\'t worry if it says \'Error: No response from twitch\', it should still work!');
  
  client.on('connected', (address, port) => {
    client.action(params.auth.channel, 'Bot Connected!');
  });

  client.on('chat', async (channel, context, message, self) => {
    if (self) return;

    (async function command() {
      let response = await shenanibot.command(message,
              context.username, context['custom-reward-id']);
      for (const message of response.split('\n')) {
        client.say(params.auth.channel, message);
      }
    })();
  });
})();
