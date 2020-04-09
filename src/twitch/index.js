const tmi = require('tmi.js');
const rumpus = require('@bscotch/rumpus-ce');
require('dotenv').config();

const delegationToken = process.env.STREAMER_DELEGATION_KEY ? process.env.STREAMER_DELEGATION_KEY : '';
const channel = process.env.TWITCH_CHANNEL;
const streamer = process.env.STREAMER_USERNAME;
const prefix = process.env.PREFIX ? process.env.PREFIX : '!';

// TODO
// Create a commands file, and a utils file
// Customize error messages
// Check for edge cases like end of queue, ect.

// Rumpus CE SDK Docs: https://github.com/bscotch/rumpus-ce

const options = {
  options: {
    debug: true
  },
  connection: {
    cluster: 'aws',
    reconnect: true
  },
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.OAUTH_TOKEN
  },
  channels: [channel]
};

let position = 0;
let queueOpen = true;
let queue = [];

const rce = new rumpus.RumpusCE(delegationToken);

const client = tmi.Client(options);

(async function main() {
  // Connect bot to server
  client.connect();

  client.on('connected', (address, port) => {
    client.action(channel, 'Bot Connected!');
  });

  client.on('disconnected', (address, port) => {
    client.action(channel, 'Bot Disconnected!');
  });

  client.on('chat', async (channel, user, message, self) => {
    let twitchUser = user['display-name'];
  });
})();