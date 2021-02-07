const Rumpus = require("@bscotch/rumpus-ce");
const ViewerLevel = require("./lib/level");
const olServer = require("../overlay/server");
const { rewardHelper } = require("../config/loader");

class ShenaniBot {
  constructor(botOptions) {
    this.rce = new Rumpus.RumpusCE(botOptions.auth.delegationToken);
    this.options = botOptions.config;
    this.streamer = botOptions.auth.streamer;
    this.queue = [];
    this.queueOpen = true;
    this.users = {};
    this.levels = {};
    if (this.options.priority === 'rotation') {
      this.currentRound = 1;
    }
    this.twitch = {
      rewards: {
        urgent: "move a level to the front of the queue",
        priority: "move a level to the front of its group",
        expedite: "move a level up one place in the queue",
        add: "add a level to the queue",
        unlimit: "ignore limit when adding a level",
      },
      rewardBehaviors: botOptions.twitch.rewardBehaviors,
      usePointsToAdd: false,
    };

    const behaviors = botOptions.twitch.rewardBehaviors;
    if (Object.keys(behaviors).find(k => behaviors[k] === 'add')) {
      this.twitch.usePointsToAdd = true;
    }
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
        case "giveboost":
          return args[1] ? this.giveBoostToUser(args[1].toLowerCase()) : "";
        case "next":
          return this.nextLevel();
        case "play":
          return this.playSpecificLevel(args.slice(1).join(' ').toLowerCase());
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
      case "check":
        return args[1] ? this.checkLevel(args[1]) : "";
      case "add":
        return args[1] ? this.addLevelToQueue(args[1], username) : "";
      case "remove":
        return args[1] ? this.removeLevelFromQueue(args[1], username) : "";
      case "boost":
        return args[1] ? this.boostLevel(args[1], username) : "";
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

    if (this.queueOpen && (user.levelsSubmitted < this.options.levelLimit || !this._hasLimit())) {
      response = `${username} is able to submit levels.`;
      return response;
    }

    user.permit = true;
    response = `@${username}, you may submit one level to the queue now.`;
    return response;
  }

  giveBoostToUser(username) {
    if (username[0] === "@") {
      username = username.slice(1);
    }

    let response;
    const user = this._getUser(username);

    user.canBoost = true;
    response = `@${username}, you may boost one level in the queue now.`;
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

  playSpecificLevel(args) {
    let index;

    let match;
    if (match = args.match(/^(next\s|last\s)?from\s([a-zA-Z0-9][a-zA-z0-9_]{3,24})\s*$/)) {
      const last = match[1] === 'last ';
      const start = last ? this.queue.length - 1 : 1;
      const stop = i => last ? i > 0 : i < this.queue.length;
      const increment = last ? -1 : 1;
      for (let i = start; stop(i); i += increment) {
        if (this.queue[i] && this.queue[i].submittedBy === match[2]) {
          index = i;
        }
      }
      if (!index) {
        return `The queue contains no levels submitted by ${match[2]}`;
      }
    }
    if (args.match(/[1-9]/) && (match = args.match(/^\d+/))) {
      index = parseInt(args, 10) - 1;
    }
    if (typeof index != 'number') {
      return "";
    }
    if (!this.queue[index]) {
      return `There is no level at position ${index + 1} in the queue!`;
    }
    if (index === 0) {
      return `You're already playing ${this.queue[index].levelName}@${this.queue[index].levelId}!`;
    }

    this._dequeueLevel();
    index -= 1;
    if (index > 0) {
      const level = this.queue[index];
      level.priority = true;
      if (this.options.priority === 'rotation') {
        level.round = this.currentRound;
      }
      this.queue.splice(index, 1)
      this.queue.unshift(level);
    }
    let response = `Pulled ${this.queue[0].levelName}@${this.queue[0].levelId} to the front of the queue...`;
    response += this._playLevel();

    olServer.sendLevels(this.queue);
    return response;
  }

  randomLevel() {
    let {empty, response} = this._dequeueLevel();
    if (!empty) {
      const markerIndex = this.queue.indexOf(null);
      if (markerIndex !== 0) {
        let groupLength = (markerIndex > -1) ? markerIndex : this.queue.length;

        const noPriorityIndex = this.queue.findIndex(l => !l || !l.priority);
        if (noPriorityIndex > 0) {
          groupLength = noPriorityIndex;
        }

        if (this.queue[groupLength - 1].round > this.currentRound) {
          groupLength = this.queue.findIndex(l => l.round > this.currentRound);
        }

        const index = Math.floor(Math.random() * groupLength);
        let randomLevel = this.queue[index];
        this.queue.splice(index, 1)
        this.queue.unshift(randomLevel);

        response = `Random Level... `
      }
      response = (response || '') + this._playLevel();
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
    if (rewardType === 'add') {
      this.twitch.usePointsToAdd = true;
    }

    let response = "Registered reward to " + rewards[rewardType] + ". "
                 + rewardHelper.updateRewardConfig(behaviors);
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
    if (rewardType === 'add') {
      this.twitch.usePointsToAdd = false;
    }

    let response = "Removed reward to " + rewards[rewardType] + ". "
                 + rewardHelper.updateRewardConfig(behaviors);
    return response;
  }

  async checkLevel(levelId) {
    let {valid, response} = this._validateLevelId(levelId)
    if (!valid) {
      return response;
    }

    let levelInfo = await this.rce.levelhead.levels.search({ levelIds: levelId, includeAliases: true, includeMyInteractions: true } );

    if (!levelInfo.length) {
      response = "Oops! That level does not exist!";
      return response;
    }

    const level = levelInfo[0];
    const interactions = level.interactions;
    let verb = 'not played';
    if (interactions) {
      if (interactions.played) {
        verb = 'played';
      }
      if (interactions.completed) {
        verb = 'beaten';
      }
    }

    response = `${this.streamer} has ${verb} ${level.title}@${level.levelId}.`;
    return response;
  }

  async addLevelToQueue(levelId, username, rewardType) {
    const user = this._getUser(username);

    if (!this.queueOpen && !user.permit) {
      let response = "Sorry, queue is closed!";
      return response;
    }

    if (this.twitch.usePointsToAdd && !rewardType) {
      let response = "Please use channel points to add levels.";
      return response;
    }

    let {valid, response} = this._validateLevelId(levelId)
    if (!valid) {
      return response;
    }

    if (this._hasLimit() && user.levelsSubmitted >= this.options.levelLimit && !user.permit && rewardType !== 'unlimit') {
      response = "You have submitted the maximum number of levels!";
      if (this.options.levelLimitType === "active") {
        response += " (You can add more when one of yours has been played.)";
      }
      return response;
    }

    const reason = this.levels[levelId];
    if (reason) {
      response = `That level ${reason}!`;
      return response;
    }

    let levelInfo = await this.rce.levelhead.levels.search({ levelIds: levelId, includeAliases: true }, { doNotUseKey: true });

    if (!levelInfo.length) {
      response = "Oops! That level does not exist!";
      return response;
    }

    let level = new ViewerLevel(
      levelId,
      levelInfo[0].title,
      username
    );

    const pos = this._enqueueLevel(level, user);
    olServer.sendLevels(this.queue);

    user.levelsSubmitted++;
    user.permit = (username === this.streamer);

    response = `${level.levelName}@${level.levelId} was added! Your level is #${pos} in the queue.`;
    response = this._hasLimit() ? `${response} Submission ${user.levelsSubmitted}/${this.options.levelLimit}` : response;

    if (this.queue.length === 1) {
      response = `${response}\n${this._playLevel()}`;
    }

    this.levels[levelId] = "is already in the queue";
    return response;
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

  boostLevel(levelId, username) {
    const user = this._getUser(username);
    if (!user.canBoost && this.streamer !== username) {
      return `You can't boost levels without permission from ${this.streamer}!`;
    }

    return this._processUrgentReward(levelId, () => user.canBoost = false);
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
    let round = 0;
    for (let i = 0; i <= maxIndex; i++) {
      const level = this.queue[i];
      if (this.options.priority === 'rotation' && level && level.round > round) {
        round = level.round;
        response = `${response} **Round ${round}** :`;
      }
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
    const response = `${prefix}add [levelcode], ${prefix}bot, ${prefix}check [levelcode], ${prefix}queue, ${prefix}remove [levelcode]`;
    return response;
  }

  showBotInfo() {
    let response = `This bot was created for the LevelHead Community by jajdp and FantasmicGalaxy.
    Want to use it in your own stream? You can get it here: https://github.com/jajdp/Shenanibot-public`;
    return response;
  }

  processReward(rewardId, message, username) {
    const behavior = this.twitch.rewardBehaviors[rewardId];
    switch (behavior) {
      case "urgent":
        return this._processUrgentReward(message[0]);
      case "priority":
        return this._processPriorityReward(message[0]);
      case "expedite":
        return this._processExpediteReward(message[0]);
      case "add":
      case "unlimit":
        const levelId = message[
          (message[0] === `${this.options.prefix}add`) ? 1 : 0
        ];
        return this.addLevelToQueue(levelId, username, behavior);
    }
    return "";
  }

  _processUrgentReward(levelId, onSuccess = () => null) {
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
    if (this.options.priority === 'rotation') {
      const prevLevel = this.queue[newIndex - 1];
      level.round = prevLevel ? prevLevel.round : this.currentRound;
    }
    this.queue.splice(newIndex, 0, level);
    onSuccess();
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
      if (!this.queue[i] || this.queue[i].priority || this.queue[i].round < level.round) {
        break;
      }
    }
    const newIndex = i + 1;
    this.queue.splice(newIndex, 0, level);
    return `${level.levelName}@${level.levelId} was marked as priority! It is now #${newIndex + 1} in the queue.`;
  }

  _processExpediteReward(levelId) {
    let { level, index, response } = this._getQueuedLevelForReward(levelId);
    if (!level) {
      return response;
    }

    if (index === 1) {
      response = "You can't expedite a level that's already next to be played.";
    } else if (!this.queue[index - 1]) {
      response = "You can't expedite a level that's right after a break in the queue.";
    } else if (this.queue[index - 1].round < level.round) {
      repsonse = "You can't expedite a level that's already the first to be played in its round.";
    } else if (this.queue[index - 1].priority && !level.priority) {
      response = "You can't expedite a normal-priority level that's right after a high-priority level.";
    } else {
      response = `${level.levelName}@${level.levelId} was expedited! It is now #${index} in the queue.`;
      index -= 1;
    }

    this.queue.splice(index, 0, level);
    return response;
  }

  _getQueuedLevelForReward(levelId) {
    let {valid, response} = this._validateLevelId(levelId)
    const i = this.queue.findIndex(l => l && l.levelId === levelId);

    if (valid) {
      if (i === 0) {
        response = "You can't change priority of the level being played!";
      } else if (i === -1) {
        response = "That level is not in the queue!";
      }
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

  _enqueueLevel(level, user) {
    let laterLevels = [];
    if (this.options.priority === 'rotation') {
      level.round = Math.max((user.lastRound || 0) + 1, this.currentRound);
      user.lastRound = level.round;
      const n = this.queue.findIndex(l => l && l.round > level.round);
      if (n > -1) {
        laterLevels = this.queue.splice(n);
      }
    }

    this.queue.push(level);
    const pos = this.queue.length;
    if (pos === 1 && this.options.priority === 'rotation') {
      this.currentRound = level.round;
    }

    while (laterLevels.length) {
      const laterLevel = laterLevels.shift();
      if (laterLevels[0] === null) {
        this.queue.push(null);
      }
      if (laterLevel) {
        this.queue.push(laterLevel);
      }
    }

    return pos;
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

    if (this.options.priority === 'rotation' && this.queue[0]) {
      this.currentRound = this.queue[0].round;
    }

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
      const level = this.queue[index];
      const username = level.submittedBy;
      const user = this._getUser(username);

      if (this.options.levelLimitType === "active") {
        user.levelsSubmitted--;
      }

      if (this.options.priority === 'rotation' && index) {
        let destRound = level.round;
        user.lastRound = 0;
        for (let i = index + 1; i < this.queue.length; i++) {
          const laterLevel = this.queue[i];
          if (laterLevel && laterLevel.submittedBy === username) {
            this.queue[index] = laterLevel;
            index = i;
            const nextDestRound = laterLevel.round;
            laterLevel.round = destRound;
            user.lastRound = destRound;
            destRound = nextDestRound;
          }
        }
      }
    }
    this.queue.splice(index, 1);
  }

  _hasLimit() {
    return this.options.levelLimitType !== 'none' && this.options.levelLimit > 0;
  }
}

module.exports = ShenaniBot;
