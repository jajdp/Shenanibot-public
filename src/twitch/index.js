const fs = require('fs');
const tmi = require('tmi.js');
const rumpus = require('@bscotch/rumpus-ce');
require('dotenv').config();

const streamerKey = process.env.STREAMER_DELEGATION_KEY ? process.env.STREAMER_DELEGATION_KEY : '';
const twitchChannel = process.env.TWITCH_CHANNEL;
const twitchStreamer = process.env.STREAMER_USERNAME;
const prefix = process.env.PREFIX ? process.env.PREFIX : '!';

// TODO
// Create a commands file, and a utils file

// Rumpus CE Package Docs: https://github.com/bscotch/rumpus-ce

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
	channels: [ twitchChannel ]
};

let queuePosition = 0;
let queueOpen = true;
let queue = [];

const rce = new rumpus.RumpusCE(streamerKey);

const client = tmi.Client(options);

(async function main() {
	// Connect bot to server
	client.connect();

	client.on('connected', (address, port) => {
		client.action(twitchChannel, 'Bot Connected!');
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
		if (twitchUser === twitchStreamer) {
			switch (command) {
				case 'close':
					queueOpen = false;
					client.action(twitchChannel, 'The queue has been closed!');
					break;
				case 'open':
					queueOpen = true;
					client.action(twitchChannel, 'The queue has been opened! Add some levels to it!');
					break;
				case 'complete':
					try {
						if (queue.length < 1) {
							throw 'There are no levels in the queue!';
						}
						if (queue.length - 1 < queuePosition) {
							throw 'You are at the end of the queue';
						}
						queue[queuePosition++].cleared = true;
						client.action(
							twitchChannel,
							`Level Cleared! Now playing ${queue[queuePosition].levelName}@${queue[queuePosition].levelId}`
						);
					} catch (error) {
						client.action(twitchChannel, `Error! ${error}`);
					}
					break;
				case 'skip':
					try {
						if (queue.length < 1) {
							throw 'There are no levels in the queue!';
						}
						if (queue.length - 1 < queuePosition) {
							throw 'You are at the end of the queue';
						}
						queue[queuePosition++].cleared = false;
						client.action(
							twitchChannel,
							`Level Skipped! Now playing ${queue[queuePosition].levelName}@${queue[queuePosition].levelId}`
						);
					} catch (error) {
						client.action(twitchChannel, `Error! ${error}`);
					}
					break;
				case 'next':
					try {
						if (queue.length - 1 < queuePosition) {
							throw 'You are at the end of the queue';
						}
						queuePosition++;
						client.action(twitchChannel, 'Next level...');
					} catch (error) {
						client.action(twitchChannel, 'Error! ${error}');
					}
					break;
				case 'prev':
					try {
						if (queuePosition === 0) {
							throw 'You are at the beginning of the queue';
						}
						queuePosition++;
						client.action(twitchChannel, 'Previous level...');
					} catch (error) {
						client.action(twitchChannel, 'Error! ${error}');
					}
					break;
				default:
					break;
			}
		}

		switch (command) {
			case 'add':
				if (!queueOpen) {
					client.action(twitchChannel, 'Sorry, queue is closed!');
				}
				if (args[1].length !== 7) {
					client.action(twitchChannel, `${args[1]} is invalid! Levelcodes are 7 characters long!`);
				}
				rce.levelhead.levels
					.search({ levelIds: args[1], includeAliases: true }, { doNotUseKey: true })
					.then((levelInfo) => {
						if (levelInfo[0] === undefined) {
							client.action(twitchChannel, 'Level does not exist!');
						}
						let viewerLevel = new ViewerLevel(
							levelInfo[0].levelId,
							levelInfo[0].title,
							levelInfo[0].alias.alias,
							levelInfo[0].alias.userId,
							twitchUser
						);
						queue.push(viewerLevel);
						client.action(
							twitchChannel,
							`Level '${viewerLevel.levelName}'@${viewerLevel.levelId} was added to the queue`
						);
					});
				break;
			case 'q':
			case 'queue':
				try {
					if (queue.length < 1) {
						throw 'The queue is empty, add some levels to it!';
					}
					let response = 'Next 5 levels: ';
					for (let i = queuePosition; i < queue.length; i++) {
						const viewerLevel = queue[i];
						response = `${response} ['${viewerLevel.levelName}'@${viewerLevel.levelId} submitted by ${viewerLevel.submittedBy}]`;
					}
					client.action(twitchChannel, response);
				} catch (error) {
					client.action(twitchChannel, `Error! ${error}`);
				}
				break;
			case 'totalq':
				client.action(twitchChannel, `Queue length: ${queue.length - queuePosition + 1}`);
				break;
			case 'current':
				let viewerLevel = queue[queuePosition];
				client.action(
					twitchChannel,
					`Current Level: ${viewerLevel.levelName}'@${viewerLevel.levelId} submitted by ${viewerLevel.submittedBy}`
				);
				break;
			case 'help':
				client.action(
					twitchChannel,
					`${prefix}add [levelcode], ${prefix}bot ${prefix}current ${prefix}queue ${prefix}totalq`
				);
				break;
			case 'bot':
				client.action(
					twitchChannel,
					'This bot was created for the LevelHead Community by jajdp and FantasmicGalaxy. Want to use it in your own stream? You can get it here: https://github.com/jajdp/Shenanibot-public'
				);
				break;
			default:
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
