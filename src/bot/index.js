let viewerLevel = require('./lib/level');

class ShenaniBot {
  constructor(rce, botOptions) {
    this.rce = rce;
    this.options = botOptions
      ? botOptions
      : {
        channel: '',
        streamer: '',
        prefix: '!'
      };
    this.queue = [];
    this.position = 0;
    this.queueOpen = true;
  }

  async command(command, username) {    
    if (!command.startsWith(this.options.prefix)) return '';
    command = command.substring(this.options.prefix.length).split(' ');

    if (username === this.options.streamer) {
      switch (command[0]) {
        case 'open':
          return this.openQueue();
        case 'close':
          return this.closeQueue();
        case 'complete':
          return this.completeLevel();
        case 'skip':
          return this.skipLevel();
        case 'next':
          return this.nextLevel();
        case 'prev':
          return this.prevLevel();
      }
    }

    switch (command[0]) {
      case 'add':
        return this.addLevelToQueue(command[1], username);
      case 'queue':
        return this.showQueue();
      case 'current':
        return this.showCurrentLevel();
      case 'commands':
      case 'help':
        return this.showBotCommands();
      case 'bot':
        return this.showBotInfo();
    }
  }

  openQueue() {
    let response = 'The queue has been opened, add some levels to it!';

    this.queueOpen = true;
    return response;
  }
  closeQueue() {
    let response = 'The queue has been closed! No more levels :(';

    this.queueOpen = false;
    return response;
  }

  completeLevel() {
    if (this.checkQueueEmpty()) {
      let response = "You can't beat a level if there aren't any in the queue!";
      return response;
    }
    this.queue[this.position].cleared = true;
    if (this.checkEndOfQueue()) {
      let response = "You beat the level, but there aren't any more in the queue!";
      return response;
    }

    this.position++;
    this.rce.levelhead.bookmarks.remove(this.queue[this.position].levelId);

    let response = `Level completed! Now playing ${this.queue[this.position].levelName}@${this.queue[this.position]
      .levelId} submitted by ${this.queue[this.position].submittedBy}`;
    return response;
  }
  skipLevel() {
    if (this.checkQueueEmpty()) {
      let response = "You can't skip a level if there aren't any in the queue!";
      return response;
    }
    this.queue[this.position].cleared = false;
    if (this.checkEndOfQueue()) {
      let response = "You skipped the level, but there aren't any more in the queue!";
      return response;
    }

    this.position++;
    this.rce.levelhead.bookmarks.remove(this.queue[this.position].levelId);

    let response = `Level skipped! Now playing ${this.queue[this.position].levelName}@${this.queue[this.position]
      .levelId} submitted by ${this.queue[this.position].submittedBy}`;
    return response;
  }
  nextLevel() {
    if (this.checkQueueEmpty()) {
      let response = "You can't move to the next level if there aren't any in the queue!";
      return response;
    }
    if (this.checkEndOfQueue()) {
      let response = 'You are already at the end of the queue!';
      return response;
    }

    this.position++;

    let response = `Next level... Now playing ${this.queue[this.position].levelName}@${this.queue[this.position]
      .levelId} submitted by ${this.queue[this.position].submittedBy}`;
    return response;
  }
  prevLevel() {
    if (this.checkQueueEmpty()) {
      let response = "You can't move to the previous level if there aren't any in the queue!";
      return response;
    }
    if (this.checkStartOfQueue()) {
      let response = 'You are already at the beginning of the queue!';
      return response;
    }

    this.position--;

    let response = `Previous level... Now playing ${this.queue[this.position].levelName}@${this.queue[this.position]
      .levelId} submitted by ${this.queue[this.position].submittedBy}`;
    return response;
  }

  async addLevelToQueue(levelId, username) {
    if (!this.queueOpen) {
      let response = 'Sorry, queue is closed!';
      return response;
    }
    if (levelId.length !== 7) {
      let response = `${levelId} is not a valid level code, they're 7 characters long!`;
      return response;
    }
    
    let levelInfo = await this.rce.levelhead.levels.search({ levelIds: levelId, includeAliases: true }, { doNotUseKey: true });
    
    let level = new viewerLevel(
      levelInfo[0].levelId,
      levelInfo[0].title,
      levelInfo[0].alias.alias,
      levelInfo[0].alias.userId,
      username
    );
    this.rce.levelhead.bookmarks.add(level.levelId);
    this.queue.push(level);

    let response = `${level.levelName}@${level.levelId} was added to the queue!`;
    return response;
  }
  showQueue() {
    if (this.checkQueueEmpty()) {
      let response = "There's no levels in the queue!";
      return response;
    }

    // add some stats about how many levels completed/skipped, and how many more are left in the queue
    let limit = Math.min(3, this.queue.length - this.position);
    let response = `Next ${limit} levels: `;
    for (let i = 0; i < limit; i++) {
      const level = this.queue[i + this.position];
      response = `${response} [${level.levelName}@${level.levelId} submitted by ${level.submittedBy}]`;
    }
    return response;
  }
  showCurrentLevel() {
    if (this.checkQueueEmpty()) {
      let response = "There's no levels in the queue!";
      return response;
    }

    let response = `Current Level: ${this.queue[this.position].levelName}@${this.queue[this.position]
      .levelId} submitted by ${this.queue[this.position].submittedBy}`;
    return response;
  }

  showBotCommands() {
    let response = `${this.options.prefix}add [levelcode], ${this.options.prefix}bot, ${this.options
      .prefix}current, ${this.options.prefix}queue`;
    return response;
  }
  showBotInfo() {
    let response = `This bot was created for the LevelHead Community by jajdp and FantasmicGalaxy.
    Want to use it in your own stream? You can get it here: https://github.com/jajdp/Shenanibot-public`;
    return response;
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

module.exports = ShenaniBot;
