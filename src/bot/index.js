level = require('./lib/level');

class ShenaniBot {
  constructor(tmiClient, rce, botOptions) {
    this.tmiClient = tmiClient;
    this.rce = rce;
    this.options = botOptions ? botOptions : {
      channel: '',
      streamer: '',
      prefix: '!'
    };
    this.queue = [];
    this.position = 0;
    this.queueOpen = false;
    this.currentLevel = {};
  }

  command(command, username) {
    if (!command.startsWith(this.prefix)) return;
    command = message.substring(prefix.length).split(' ');

    if (username === this.options.streamer) {
      switch (command[0]) {
        case 'open':
          this.openQueue();
          break;
        case 'close':
          this.closeQueue();
          break;
        case 'complete':
          this.completeLevel();
          break;
        case 'skip':
          this.skipLevel();
          break;
        case 'next':
          this.nextLevel();
          break;
        case 'prev':
          this.prevLevel();
          break;
      }
    }

    switch (command[0]) {
      case 'add':
        this.addLevelToQueue(command[1]);
        break;
      case 'queue':
        this.showQueue();
        break;
      case 'current':
        this.showCurrentLevel();
        break;
      case 'commands':
      case 'help':
        this.showBotCommands();
        break;
      case 'bot':
        this.showBotInfo();
        break;
    }

    this.currentLevel = this.queue[this.position];
  }

  openQueue() {
    let response = 'The queue has been opened, add some levels to it!';

    this.queueOpen = true;
    this.tmiClient.say(this.options.channel, response);
  }
  closeQueue() {
    let response = 'The queue has been opened, add some levels to it!';

    this.queueOpen = true;
    this.tmiClient.say(this.options.channel, response);
  }

  completeLevel() {
    if (this.checkQueueEmpty()) {
      let response = 'You can\'t beat a level if there aren\'t any in the queue!';
      this.tmiClient.say(this.options.channel, response);
      return;
    };
    this.currentLevel.cleared = true;
    if (this.checkEndOfQueue()) {
      let response = 'You beat the level, but there aren\'t any more in the queue!';
      this.tmiClient.say(this.options.channel, response);
      return;
    };

    this.position++;
    this.rce.levelhead.bookmarks.remove(this.currentLevel.levelId);

    let response = `Level completed! Now playing ${this.currentLevel.levelName}@${this.currentLevel.levelId} submitted by ${this.currentLevel.submittedBy}`;
    this.tmiClient.say(this.options.channel, response);
  }
  skipLevel() {
    if (this.checkQueueEmpty()) {
      let response = 'You can\'t skip a level if there aren\'t any in the queue!';
      this.tmiClient.say(this.options.channel, response);
      return;
    };
    this.currentLevel.cleared = false;
    if (this.checkEndOfQueue()) {
      let response = 'You skipped the level, but there aren\'t any more in the queue!';
      this.tmiClient.say(this.options.channel, response);
      return;
    };

    this.position++;
    this.rce.levelhead.bookmarks.remove(this.currentLevel.levelId);

    let response = `Level skipped! Now playing ${this.currentLevel.levelName}@${this.currentLevel.levelId} submitted by ${this.currentLevel.submittedBy}`;
    this.tmiClient.say(this.options.channel, response);
  }
  nextLevel() {
    if (this.checkQueueEmpty()) {
      let response = 'You can\'t move to the next level if there aren\'t any in the queue!';
      this.tmiClient.say(this.options.channel, response);
      return;
    };
    if (this.checkEndOfQueue()) {
      let response = 'You are already at the end of the queue!';
      this.tmiClient.say(this.options.channel, response);
      return;
    };

    this.position++;

    let response = `Next level... Now playing ${this.currentLevel.levelName}@${this.currentLevel.levelId} submitted by ${this.currentLevel.submittedBy}`;
    this.tmiClient.say(this.options.channel, response);
  }
  prevLevel() {
    if (this.checkQueueEmpty()) {
      let response = 'You can\'t move to the previous level if there aren\'t any in the queue!';
      this.tmiClient.say(this.options.channel, response);
      return;
    };
    if (this.checkStartOfQueue()) {
      let response = 'You are already at the beginning of the queue!';
      this.tmiClient.say(this.options.channel, response);
      return;
    };

    this.position--;

    let response = `Previous level... Now playing ${this.currentLevel.levelName}@${this.currentLevel.levelId} submitted by ${this.currentLevel.submittedBy}`;
    this.tmiClient.say(this.options.channel, response);
  }

  addLevelToQueue(levelId) {
    if (!this.queueOpen) {
      let response = 'Sorry, queue is closed!';
      this.tmiClient.say(this.options.channel, response);
      return;
    }
    if (levelId.length !== 7) {
      let response = `${levelId} is not a valid level code, they're 7 characters long!`;
      this.tmiClient.say(this.options.channel, response);
      return;
    }
    this.rce.levelhead.levels.search({ levelIds: levelId, includeAliases: true }, { doNotUseKey: true }).then((levelInfo) => {
      if (levelInfo[0] === undefined) {
        this.tmiClient.say(this.options.channel, 'Oops! Level does not exist!');
      }

      let level = new level(
        levelInfo[0].levelId,
        levelInfo[0].title,
        levelInfo[0].alias.alias,
        levelInfo[0].alias.userId,
        twitchUser
      );
      this.rce.levelhead.bookmarks.add(level.levelId);
      this.queue.push(level);

      let response = `Level '${level.levelName}'@${level.levelId} was added to the queue!`;
      this.tmiClient.say(this.options.channel, response);
    });
  }
  showQueue() {
    if (this.checkQueueEmpty()) {
      let response = 'There\'s no levels in the queue!';
      this.tmiClient.say(this.options.channel, response);
    };

    // add some stats about how many levels completed/skipped, and how many more are left in the queue
    let response = `Next 3 levels: `;
    for (let i = position; i < this.queue.length; i++) {
      if (i + 3 === position) break;

      const level = this.queue[i];
      response = `${response} ['${level.levelName}'@${level.levelId} submitted by ${level.submittedBy}]`;
    }
    this.tmiClient.say(this.options.channel, response);
  }
  showCurrentLevel() {
    let response = `Current Level: ${this.currentLevel.levelName}'@${this.currentLevel.levelId} submitted by ${this.currentLevel.submittedBy}`;
    this.tmiClient.say(this.options.channel, response);
  }

  showBotCommands() {
    let response = `${this.options.prefix}add [levelcode], ${this.options.prefix}bot, ${this.options.prefix}current, ${this.options.prefix}queue, ${this.options.prefix}totalq,`;
    this.tmiClient.say(this.options.channel, response);
  }
  showBotInfo() {
    let response = `This bot was created for the LevelHead Community by jajdp and FantasmicGalaxy.
    Want to use it in your own stream? You can get it here: https://github.com/jajdp/Shenanibot-public`;
    this.tmiClient.say(this.options.channel, response);
  }

  checkQueueEmpty() {
    if (this.queue.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  checkStartOfQueue() {
    if (this.position === 0) {
      return true;
    } else {
      return false;
    }
  }

  checkEndOfQueue() {
    if (this.position === this.queue.length - 1) {
      return true;
    } else {
      return false;
    }
  }
}
