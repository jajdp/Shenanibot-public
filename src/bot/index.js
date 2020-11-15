const Rumpus = require("@bscotch/rumpus-ce");
const ViewerLevel = require("./lib/level");
const olServer = require("../overlay/server");
const rewardHelper = require("../config/rewardHelper");

class ShenaniBot {
  constructor(botOptions) {
    this.rce = new Rumpus.RumpusCE(botOptions.auth.delegationToken);
    this.options = botOptions.config;
    this.streamer = botOptions.auth.streamer;
    this.queue = [];
    this.queueOpen = true;
    this.users = {};
    this.levels = {};
    this.twitch = {
      rewards: {
        urgent: "move a level to the front of the queue",
        priority: "move a level to the front of its group",
      },
      rewardBehaviors: botOptions.twitch.rewardBehaviors
    };
  }

  async command(message, username, rewardId) {
    const args = message.split(" ");
    const command = args[0].startsWith(this.options.prefix)
                  ? args[0].substring(this.options.prefix.length)
                  : undefined;
    if (! (command || rewardId)) {
      return "";
    }

    if (username === this.streamer) {
      switch (command) {
        case "open":
          return this.openQueue();
        case "close":
          return this.closeQueue();
        case "permit":
          return args[1] ? this.permitUser(args[1].toLowerCase()) : "";
        case "next":
          return this.nextLevel();
        case "random":
          return this.randomLevel();
        case "mark":
          return this.makeMarker();
        case "reward":
          return args[1] ? this.setReward(args[1].toLowerCase(), rewardId) : "";
        case "noreward":
          return args[1] ? this.unsetReward(args[1].toLowerCase()) : "";
      }
    }

    if (rewardId) {
      return this.processReward(rewardId, args, username);
    }

    switch (command) {
      case "add":
        return args[1] ? this.addLevelToQueue(args[1], username) : "";
      case "remove":
        return args[1] ? this.removeLevelFromQueue(args[1], username) : "";
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
    olServer.sendStatus(true);
    return response;
  }

  closeQueue() {
    let response = "The queue has been closed! No more levels :(";

    this.queueOpen = false;
    olServer.sendStatus(false);
    return response;
  }

  permitUser(username) {
    if (username[0] === "@") {
      username = username.slice(1);
    }

    let response;
    const user = this._getUser(username);

    if (this.queueOpen && (user.levelsSubmitted < this.options.levelLimit || this.options.levelLimit === 0)) {
      response = `${username} is able to submit levels.`;
      return response;
    }

    user.permit = true;
    response = `@${username}, you may submit one level to the queue now.`;
    return response;
  }

  nextLevel() {
    let {empty, response} = this._dequeueLevel();
    if (!empty) {
      response = this._playLevel();
    }

    olServer.sendLevels(this.queue);
    return response;
  }

  randomLevel() {
    let {empty, response} = this._dequeueLevel();
    if (!empty) {
      const markerIndex = this.queue.indexOf(null);
      if (markerIndex !== 0) {
        const maxIndex = (markerIndex > -1) ? markerIndex : this.queue.length;
        const index = Math.floor(Math.random() * maxIndex);
        let randomLevel = this.queue[index];
        this.queue.splice(index, 1)
        this.queue.unshift(randomLevel);

        response = `Random Level... `
      }
      response = (response || '') + this._playLevel()
    }

    olServer.sendLevels(this.queue);
    return response;
  }

  async makeMarker() {
    // no point making back-to-back markers
    if (this.queue.length > 0 && !this.queue[this.queue.length - 1]) {
      return '';
    }

    this.queue.push(null);
    olServer.sendLevels(this.queue);
    let response = "A marker has been added to the queue.";
    return response;
  }

  async setReward(rewardType, rewardId) {
    const rewards = this.twitch.rewards;
    const behaviors = this.twitch.rewardBehaviors;
    if (!rewards[rewardType]) {
      return `Unknown reward type: ${rewardType}; `
           + "known types are: " + Object.keys(rewards).join(", ");
    }
    if (!rewardId) {
      return "To configure a custom channel points reward to "
           + rewards[rewardType]
           + `, redeem the reward with the message '!reward ${rewardType}'`;
    }
    if (behaviors[rewardId]) {
      if (behaviors[rewardId] === rewardType) {
        return `That reward is already set up to ${rewards[rewardType]}`;
      } else {
        return "That reward is currently set up to "
             + rewards[behaviors[rewardId]]
             + "; if you want to change its behavior, first use "
             + `'!noreward ${behaviors[rewardId]}'`;
      }
    }
    if (Object.keys(behaviors).some(k => behaviors[k] === rewardType)) {
      return `Another reward is already set up to ${rewards[rewardType]}; `
           + "if you want to switch rewards for this behavior, first use "
           + `'!noreward ${rewardType}'`;
    }

    behaviors[rewardId] = rewardType;

    let response = "Registered reward to " + rewards[rewardType];
    if (this.options.dataPath) {
        rewardHelper.updateRewardConfigFile(behaviors);
    } else {
        const optName = rewardHelper.configKeyFor(rewardType);
        response = response
                 + "; to make this change persist, add the following line to "
                 + "your ShenanaBot .env file:\n"
                 + `${optName}="${rewardId}"\n`
                 + `(If your .env file already has a value for ${optName}, `
                 + "you'll need to remove it; multiple rewards cannot share "
                 + "a behavior.)";
    }
    return response;
  }

  async unsetReward(rewardType) {
    const rewards = this.twitch.rewards;
    const behaviors = this.twitch.rewardBehaviors;

    if (!rewards[rewardType]) {
      return `Unknown reward type: ${rewardType}; `
           + "known types are: " + Object.keys(rewards).join(", ");
    }

    const rewardId = Object.keys(behaviors)
                           .find(k => behaviors[k] === rewardType);
    if (!rewardId) {
      return `No reward is set up to ${rewards[rewardType]}`
    }

    behaviors[rewardId] = undefined;

    let response = "Removed reward to " + rewards[rewardType];
    if (this.options.dataPath) {
        rewardHelper.updateRewardConfigFile(behaviors);
    } else {
        const optName = rewardHelper.configKeyFor(rewardType);
        response = response
                 + "; to make this change persist, remove the following line "
                 + "from your ShenanaBot .env file:\n"
                 + `${optName}="${rewardId}"\n`;
    }
    return response;
  }

  async addLevelToQueue(levelId, username) {
    const user = this._getUser(username);

    if (!this.queueOpen && !user.permit) {
      let response = "Sorry, queue is closed!";
      return response;
    }

    let {valid, response} = this._validateLevelId(levelId)
    if (!valid) {
      return response;
    }

    if (this.options.levelLimit > 0 && user.levelsSubmitted >= this.options.levelLimit && !user.permit) {
      response = "You have submitted the maximum number of levels!";

      return response;
    }

    const reason = this.levels[levelId];
    if (reason) {
      response = `That level ${reason}!`;
      return response;
    }

    let levelInfo = await this.rce.levelhead.levels.search({ levelIds: levelId, includeAliases: true }, { doNotUseKey: true });

    try {
      let level = new ViewerLevel(
        levelInfo[0].levelId,
        levelInfo[0].title,
        username
      );
      this.queue.push(level);
      olServer.sendLevels(this.queue);

      user.levelsSubmitted++;
      user.permit = (username === this.streamer);

      response = `${level.levelName}@${level.levelId} was added! Your level is #${this.queue.length} in the queue.`;
      response = this.options.levelLimit > 0 ? `${response} Submission ${user.levelsSubmitted}/${this.options.levelLimit}` : response;

      if (this.queue.length === 1) {
        response = `${response}\n${this._playLevel()}`;
      }

      this.levels[levelInfo[0].levelId] = "is already in the queue";
      return response;
    } catch (error) {
      console.error(error);
      response = "Oops! That level does not exist!";
      return response;
    }
  }

  removeLevelFromQueue(levelId, username) {
    let {valid, response} = this._validateLevelId(levelId)
    if (!valid) {
      return response;
    }

    const i = this.queue.findIndex(l => l && l.levelId === levelId);
    if (i === -1) {
      return "The level you tried to remove is not in the queue";
    }

    const level = this.queue[i];

    if (level.submittedBy !== username && this.streamer !== username) {
      return "You can't remove a level from the queue that you didn't submit!";
    }
    if (i === 0) {
      return "You can't remove the current level from the queue!";
    }

    this._removeFromQueue(i);
    olServer.sendLevels(this.queue);
    response = `${level.levelName}@${level.levelId} was removed from the queue!`;
    this.levels[levelId] = (username === this.streamer) ? `was removed by ${username}; it can't be re-added` : null;

    return response;
  }

  showQueue() {
    if (  this.queue.length === 0
       || (this.queue.length === 1 && !this.queue[0]) ) {
      let response = "There aren't any levels in the queue!";
      return response;
    }

    let limit = Math.min(10, this.queue.length);
    let maxIndex = limit - 1;
    let response = '';
    for (let i = 0; i <= maxIndex; i++) {
      const level = this.queue[i];
      if (level) {
        response = `${response} [${level.levelName}@${level.levelId}]`;
      } else {
        response = `${response} [== break ==]`;
        if (maxIndex < this.queue.length - 1) {
          maxIndex += 1;
        } else {
          limit -= 1;
        }
      }
    }
    response = `Next ${limit} levels:${response}`;
    return response;
  }

  showBotCommands() {
    const prefix = this.options.prefix;
    const response = `${prefix}add [levelcode], ${prefix}bot, ${prefix}queue, ${prefix}remove [levelcode]`;
    return response;
  }

  showBotInfo() {
    let response = `This bot was created for the LevelHead Community by jajdp and FantasmicGalaxy.
    Want to use it in your own stream? You can get it here: https://github.com/jajdp/Shenanibot-public`;
    return response;
  }

  processReward(rewardId, message, username) {
    switch (this.twitch.rewardBehaviors[rewardId]) {
      case "urgent":
        return this._processUrgentReward(message[0]);
      case "priority":
        return this._processPriorityReward(message[0]);
    }
    return "";
  }

  _processUrgentReward(levelId) {
    const { level, response } = this._getQueuedLevelForReward(levelId);
    if (!level) {
      return response;
    }
    level.priority = true;
    let newIndex = this.queue.findIndex(
                  (level, index) => index && (!level || !level.priority));
    if (newIndex === -1) {
      newIndex = this.queue.length;
    }
    this.queue.splice(newIndex, 0, level);
    return `${level.levelName}@${level.levelId} was marked as priority! It is now #${newIndex + 1} in the queue.`;
  }

  _processPriorityReward(levelId) {
    const { level, index, response } = this._getQueuedLevelForReward(levelId);
    if (!level) {
      return response;
    }
    level.priority = true;
    let i;
    for (i = index - 1; i > 0; i--) {
      if (!this.queue[i] || this.queue[i].priority) {
        break;
      }
    }
    const newIndex = i + 1;
    this.queue.splice(newIndex, 0, level);
    return `${level.levelName}@${level.levelId} was marked as priority! It is now #${newIndex + 1} in the queue.`;
  }

  _getQueuedLevelForReward(levelId) {
    let response;
    const i = this.queue.findIndex(l => l && l.levelId === levelId);

    if (i === 0) {
      response = "You can't change priority of the level being played!";
    } else if (i === -1) {
      response = "That level is not in the queue!";
    }

    return {
      level: i > 0 ? this.queue.splice(i, 1)[0] : null,
      index: i,
      response
    };
  }

  _getUser(username) {
    if (!this.users[username]) {
      this.users[username] = {
        levelsSubmitted: 0,
        permit: username === this.streamer
      };
    }
    return this.users[username];
  }

  _dequeueLevel() {
    if (this.queue.length === 0) {
      return {
        empty: true,
        response: "There aren't any levels in the queue!"
      };
    }

    if (this.queue[0]) {
      this.rce.levelhead.bookmarks.remove(this.queue[0].levelId);
      this.levels[this.queue[0].levelId] = "was already played";
    }
    this._removeFromQueue(0);

    return {
      empty: !this.queue.length,
      response: (!this.queue.length) ? "The queue is now empty." : null
    };
  }

  _playLevel() {
    if (this.queue[0]) {
      this.rce.levelhead.bookmarks.add(this.queue[0].levelId);
      return `Now playing ${this.queue[0].levelName}@${this.queue[0].levelId} submitted by ${this.queue[0].submittedBy}`;
    }
    return "Not currently playing a queued level.";
  }

  _validateLevelId(id) {
    if (id.length !== 7) {
      return {
        valid: false,
        response: `${id} is not a valid level code, they're 7 characters long!`
      };
    }
    return {valid: true, response: null};
  }

  _removeFromQueue(index) {
    if (this.queue[index]) {
      const username = this.queue[index].submittedBy;

      if (this.options.levelLimitType === "active") {
        this._getUser(username).levelsSubmitted--;
      }
    }
    this.queue.splice(index, 1);
  }
}

module.exports = ShenaniBot;
