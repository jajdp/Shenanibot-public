const Rumpus = require("@bscotch/rumpus-ce");
const ViewerLevel = require("./lib/level");

class ShenaniBot {
  constructor(botOptions) {
    this.rce = new Rumpus.RumpusCE(botOptions.auth.delegationToken);
    this.options = botOptions.config;
    this.streamer = botOptions.auth.streamer;
    this.queue = [];
    this.queueOpen = true;
    this.users = {};
  }

  async command(command, username) {
    if (!command.startsWith(this.options.prefix)) return "";
    command = command.substring(this.options.prefix.length).split(" ");

    if (username === this.streamer) {
      switch (command[0]) {
        case "open":
          return this.openQueue();
        case "close":
          return this.closeQueue();
        case "next":
          return this.nextLevel();
        case "random":
          return this.randomLevel();
      }
    }

    switch (command[0]) {
      case "add":
        return this.addLevelToQueue(command[1], username);
      case "remove":
        return this.removeLevelFromQueue(command[1], username);
      case "queue":
        return this.showQueue();
      case "commands":
      case "help":
        return this.showBotCommands();
      case "bot":
        return this.showBotInfo();
    }

    return "";
  }

  openQueue() {
    let response = "The queue has been opened, add some levels to it!";

    this.queueOpen = true;
    return response;
  }
  closeQueue() {
    let response = "The queue has been closed! No more levels :(";

    this.queueOpen = false;
    return response;
  }

  nextLevel() {
    if (this.queue.length === 0) {
      let response = "There aren't any levels in the queue!";
      return response;
    }
    if (this.options.levelLimitType === "active") {
      this.users[this.queue[0].submittedBy].levelsSubmitted--;
    }

    this.rce.levelhead.bookmarks.remove(this.queue[0].levelId);
    this.queue.shift();
    
    if (this.queue.length === 0) {
      let response = "The queue is now empty.";
      return response;
    }

    this.rce.levelhead.bookmarks.add(this.queue[0].levelId);
    let response = `Now playing ${this.queue[0].levelName}@${this.queue[0].levelId} submitted by ${this.queue[0].submittedBy}`;
    return response;
  }

  randomLevel() {
    if (this.queue.length === 0) {
      let response = "There aren't any levels in the queue!";
      return response;
    }
    if (this.options.levelLimitType === "active") {
      this.users[this.queue[0].submittedBy].levelsSubmitted--;
    }

    this.rce.levelhead.bookmarks.remove(this.queue[0].levelId);
    this.queue.shift();

    if (this.queue.length === 0) {
      let response = "The queue is now empty.";
      return response;
    }

    let index = Math.round(Math.random() * (this.queue.length - 1));
    let randomLevel = this.queue[index];
    this.queue.splice(index, 1)
    this.queue.unshift(randomLevel);

    this.rce.levelhead.bookmarks.add(this.queue[0].levelId);
    let response = `Random Level... Now playing ${this.queue[0].levelName}@${this.queue[0].levelId} submitted by ${this.queue[0].submittedBy}`;
    return response;
  }

  async addLevelToQueue(levelId, username) {
    if (!this.queueOpen) {
      let response = "Sorry, queue is closed!";
      return response;
    }
    if (levelId.length !== 7) {
      let response = `${levelId} is not a valid level code, they're 7 characters long!`;
      return response;
    }
    if (this.options.levelLimit > 0 && this.users[username] && this.users[username].levelsSubmitted >= this.options.levelLimit) {
      let response = "Oops, you have submitted the maximum number of levels, so you can't submit any more!";
      return response;
    }
    for (let i = 0; i < this.queue.length; i++) {
      const level = this.queue[i];

      if (level.levelId === levelId) {
        let response = "That level is already in the queue!";
        return response;
      }
    }

    let levelInfo = await this.rce.levelhead.levels.search({ levelIds: levelId, includeAliases: true }, { doNotUseKey: true });

    try {
      let level = new ViewerLevel(
        levelInfo[0].levelId,
        levelInfo[0].title,
        username
      );
      this.queue.length === 0 ? this.rce.levelhead.bookmarks.add(level.levelId) : null;
      this.queue.push(level);

      this.users[username] ? this.users[username].levelsSubmitted++ : this.users[username] = { levelsSubmitted: 1 };

      let response = `${level.levelName}@${level.levelId} was added to the queue! There are ${this.queue.length - 1} levels before yours in the queue.`;
      response = this.options.levelLimit > 0 ? `${response} You have ${this.options.levelLimit - this.users[username].levelsSubmitted} level submissions left` : response;
      return response;
    } catch (error) {
      console.error(error);
      let response = "Oops! That level does not exist!";
      return response;
    }

  }
  removeLevelFromQueue(levelId, username) {
    if (levelId.length !== 7) {
      let response = `${levelId} is not a valid level code, they're 7 characters long!`;
      return response;
    }

    for (let i = 0; i < this.queue.length; i++) {
      const level = this.queue[i];

      if (level.levelId === levelId) {
        if (level.submittedBy === username) {
          if (i === 0) {
            let response = "You can't remove the current level from the queue!";
            return response;
          }
          
          this.queue.splice(i, 1);
          if (this.options.levelLimitType === 'active') {
            this.users[username].levelsSubmitted--;
          }

          let response = `${level.levelName}@${level.levelId} was removed from the queue!`;
          return response;
        } else {
          let response = "You can't remove a level from the queue that you didn't submit!";
          return response;
        }
      }
    }
    let response = "The level you tried to remove doesn't exist :(";
    return response;
  }
  showQueue() {
    if (this.queue.length === 0) {
      let response = "There aren't any levels in the queue!";
      return response;
    }

    let limit = Math.min(10, this.queue.length);
    let response = `Next ${limit} levels: `;
    for (let i = 0; i < limit; i++) {
      const level = this.queue[i];
      response = `${response} [${level.levelName}@${level.levelId}]`;
    }
    return response;
  }

  showBotCommands() {
    let response = `${this.options.prefix}add [levelcode], ${this.options.prefix}bot, ${this.options.prefix}queue`;
    return response;
  }
  showBotInfo() {
    let response = `This bot was created for the LevelHead Community by jajdp and FantasmicGalaxy.
    Want to use it in your own stream? You can get it here: https://github.com/jajdp/Shenanibot-public`;
    return response;
  }
}

module.exports = ShenaniBot;
