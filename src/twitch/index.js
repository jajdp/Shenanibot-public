const fs = require('fs');
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
    // check to see if message isn't a command, if it isn't a command, do nothing
    if (!message.startsWith(prefix)) {
      return;
    }

    // otherwise, get the arguments of the command, and name of the user
    let args = message.substring(prefix.length).split(' ');
    let command = args[0];
    let twitchUser = user['display-name'];

    // Queue managment commands
    // Check if user is the streamer
    if (twitchUser === streamer) {
      switch (command) {
        case 'close':
          queueOpen = false;
          client.say(channel, 'The queue has been closed!');
          break;
        case 'open':
          queueOpen = true;
          client.say(channel, 'The queue has been opened! Add some levels to it!');
          break;
        case 'complete':
          if (checkQueueEmpty(client, queue)) return;

          queue[position].cleared = true;
          if (!checkEndOfQueue(client, queue, position)) position++;

          rce.levelhead.bookmarks.remove(queue[position].levelId);

          client.say(
            channel,
            `Level completed! Now playing ${queue[position].levelName}@${queue[position].levelId} submitted by ${queue[position].submittedBy}`
          );
          break;
        case 'skip':
          if (checkQueueEmpty(client, queue) || checkEndOfQueue(client, queue, position)) return;

          queue[position].cleared = false;
          if (!checkEndOfQueue(client, queue, position)) position++;

          rce.levelhead.bookmarks.remove(queue[position].levelId);

          client.say(
            channel,
            `Level skipped! Now playing ${queue[position].levelName}@${queue[position].levelId} submitted by ${queue[position].submittedBy}`
          );
          break;
        case 'next':
          if (checkEndOfQueue(client, queue, position)) return;

          position++;
          client.say(channel, `Next level... Now playing ${queue[position].levelName}@${queue[position].levelId} submitted by ${queue[position].submittedBy}`);
          break;
        case 'prev':
          if (checkStartOfQueue(client, queue, position)) return;

          position--;
          client.say(channel, `Previous level... Now playing ${queue[position].levelName}@${queue[position].levelId} submitted by ${queue[position].submittedBy}`);
          break;
      }
    }

    switch (command) {
      case 'add':
        if (!queueOpen) {
          client.say(channel, 'Sorry, queue is closed!');
          return;
        }
        if (args[1].length !== 7) {
          client.say(channel, `${args[1]} is not a valid level code, they're 7 characters long!`);
          return;
        }
        rce.levelhead.levels
          .search({ levelIds: args[1], includeAliases: true }, { doNotUseKey: true })
          .then((levelInfo) => {
            if (levelInfo[0] === undefined) {
              client.say(channel, 'Oops! Level does not exist!');
            }

            let viewerLevel = new ViewerLevel(
              levelInfo[0].levelId,
              levelInfo[0].title,
              levelInfo[0].alias.alias,
              levelInfo[0].alias.userId,
              twitchUser
            );
            rce.levelhead.bookmarks.add(viewerLevel.levelId);

            queue.push(viewerLevel);
            client.say(
              channel,
              `Level '${viewerLevel.levelName}'@${viewerLevel.levelId} was added to the queue!`
            );
          });
        break;
      case 'q':
      case 'queue':
        if (checkQueueEmpty(client, queue)) return;

        //sequencially add each of the level's details to the response
        let response = 'Next 5 levels: ';
        for (let i = position; i < queue.length; i++) {
          if (i + 5 >= position) break;

          const viewerLevel = queue[i];
          response = `${response} ['${viewerLevel.levelName}'@${viewerLevel.levelId} submitted by ${viewerLevel.submittedBy}]`;
        }
        client.say(channel, response);
        break;
      case 'totalq':
        client.say(channel, `Queue length: ${queue.length - position + 1}`);
        break;
      case 'current':
        let viewerLevel = queue[position];
        client.say(
          channel,
          `Current Level: ${viewerLevel.levelName}'@${viewerLevel.levelId} submitted by ${viewerLevel.submittedBy}`
        );
        break;
      case 'commands':
      case 'help':
        client.say(
          channel,
          `${prefix}add [levelcode], ${prefix}bot, ${prefix}current, ${prefix}queue, ${prefix}totalq,`
        );
        break;
      case 'bot':
        client.say(
          channel,
          'This bot was created for the LevelHead Community by jajdp and FantasmicGalaxy. Want to use it in your own stream? You can get it here: https://github.com/jajdp/Shenanibot-public'
        );
        break;
    }
  });
})();

class ViewerLevel {
  constructor(levelId, levelName, creatorAlias, creatorId, submittedBy) {
    this.levelId = levelId;
    this.levelName = levelName;
    this.creatorAlias = creatorAlias;
    this.creatorId = creatorId;
    this.submittedBy = submittedBy;
    this.cleared = false;
  }
}

function checkQueueEmpty(client, queue) {
  if (queue.length < 1) {
    client.say(channel, 'There are no levels in the queue!');
    return true;
  } else {
    return false;
  }
}

function checkStartOfQueue(client, position) {
  if (position === 0) {
    client.say(channel, 'You are at the beginning of the queue');
    return true;
  } else {
    return false;
  }
}

function checkEndOfQueue(client, queue, position) {
  if (queue.length - 1 === position) {
    client.say(channel, 'You are at the end of the queue');
    return true;
  } else {
    return false;
  }
}