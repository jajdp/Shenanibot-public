const fs = require('fs');
const tmi = require('tmi.js');
const rumpus = require('@bscotch/rumpus-ce');

const buffer = fs.readFileSync(__dirname + '/properties.json');
const parsed = JSON.parse(buffer.toString());

const streamerKey = parsed.delegationKeyStreamer;
const twitchChannel = parsed.twitchChannel;
const twitchStreamer = parsed.twitchStreamer;
const prefix = parsed.prefix;

// TODO
// Create a utils file
// Add the actual functionality to the commands
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
		username: parsed.username,
		password: parsed.password
	},
	channels: [ twitchChannel ]
};

let queuePosition = 0;
let queueOpen = false;
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
				case 'clear':
					try {
						if (queue.length < 1) {
							throw 'There are no levels in the queue!';
						}
						queue[queuePosition].cleared = true;
						client.action(twitchChannel, 'Level Cleared!');
					} catch (error) {
						client.action(twitchChannel, 'Error! ');
					}
					break;
				case 'skip':
					try {
						if (queue.length < 1) {
							throw 'There are no levels in the queue!';
						}
						queue[queuePosition].cleared = false;
						client.action(twitchChannel, 'Level Skipped!');
					} catch (error) {
						client.action(twitchChannel, 'Error! ');
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
						client.action(twitchChannel, 'Error! ');
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
						client.action(twitchChannel, 'Error! ');
					}
					break;
				default:
					break;
			}
		}

		switch (command) {
			case 'add':
				try {
					if (args[1].length !== 7) {
						throw 'Level codes are 7 characters long!';
					}
					let levelInfo = await rce.levelhead.levels.search(
						{ levelIds: args[1], includeAliases: true },
						{ doNotUseKey: true }
					)[0];
					let viewerLevel = new ViewerLevel(
						levelInfo.levelId,
						levelInfo.title,
						levelInfo.alias.alias,
						levelInfo.alias.userId,
						twitchUser
					);
					if (levelInfo === undefined) {
						throw 'Level does not exist!';
					}
					queue.push(viewerLevel);
					client.action(
						twitchChannel,
						`Level '${viewerLevel.levelName}'@${viewerLevel.levelId} was added to the queue`
					);
				} catch (error) {
					client.action(twitchChannel, `Invalid level code! ${error}`);
				}
				break;
			case 'queue' || 'q':
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
				client.action(twitchChannel, 'This bot was created for the LevelHead Community by jajdp and FantasmicGalaxy');
				client.action(
					twitchChannel,
					'Want to use it in your own stream? You can get it here: https://github.com/jajdp/Shenanibot-public'
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
async function addLevel(levelId) {}
