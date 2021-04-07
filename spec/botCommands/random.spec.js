const itDequeues = require("../dequeue.template-spec");
const itPlaysALevel = require("../playLevel.template-spec");

let setRandomizerToMin;

describe("the !random command", () => {
  beforeAll(function() {
    setRandomizerToMin = this.setRandomizerToMin;
  });

  const cb = async bot => {
    setRandomizerToMin();
    await bot.command("!random", "streamer");
  };
  itDequeues(cb);
  itPlaysALevel(2, cb);

  describe("when rolling maximum random values", () => {
    beforeEach(function() {
      this.setRandomizerToMax();
    });

    it("returns the last eligible level", async function() {
      const bot = this.buildBotInstance();
      await this.addLevels(bot, 10);

      await bot.command("!random", "streamer");

      expect(this.bookmarks).toEqual(["valid10"]);
    });

    it("does not read past a marker in position 2", async function() {
      const bot = this.buildBotInstance();
      await this.addLevels(bot, 1);
      await bot.command("!mark", "streamer");
      await this.addLevels(bot, 5, 6);

      await bot.command("!random", "streamer");

      expect(this.bookmarks).toEqual([]);
    });

    it("does not read past a marker mid-queue", async function() {
      const bot = this.buildBotInstance();
      await this.addLevels(bot, 5);
      await bot.command("!mark", "streamer");
      await this.addLevels(bot, 5, 6);

      await bot.command("!random", "streamer");

      expect(this.bookmarks).toEqual(["valid05"]);
    });

    it("does not read past a marker for a priority level", async function() {
      const bot = this.buildBotInstance();
      await this.addLevels(bot, 2);
      await bot.command("valid02", "viewer", "reward-id-priority");
      await bot.command("!mark", "streamer");
      await this.addLevels(bot, 5, 3);
      await bot.command("valid03", "viewer", "reward-id-priority");

      await bot.command("!random", "streamer");

      expect(this.bookmarks).toEqual(["valid02"]);
    });

    it("works even if the 'now playing' entry was a marker", async function() {
      const bot = this.buildBotInstance();
      await bot.command("!mark", "streamer");
      await this.addLevels(bot, 10);

      await bot.command("!random", "streamer");

      expect(this.bookmarks).toEqual(["valid10"]);
    });

    it("does not read past priority levels to choose a non-priority level",
       async function() {
      const bot = this.buildBotInstance({
        twitch: {rewardBehaviors: this.optionQueueJumpRewards}
      });
      await this.addLevels(bot, 10);
      await bot.command("valid02", "viewer", "reward-id-priority");
      await bot.command("valid03", "viewer", "reward-id-priority");

      await bot.command("!random", "streamer");

      expect(this.bookmarks).toEqual(["valid03"]);
    });

    it("does not read past priority levels to find a marker",
       async function() {
      const bot = this.buildBotInstance({
        twitch: {rewardBehaviors: this.optionQueueJumpRewards}
      });
      await this.addLevels(bot, 5);
      await bot.command("valid02", "viewer", "reward-id-priority");
      await bot.command("valid03", "viewer", "reward-id-priority");
      await bot.command("!mark", "streamer");
      await this.addLevels(bot, 5, 6);

      await bot.command("!random", "streamer");

      expect(this.bookmarks).toEqual(["valid03"]);
    });

    it("doesn't care about priority levels after markers", async function() {
      const bot = this.buildBotInstance();
      await this.addLevels(bot, 5);
      await bot.command("!mark", "streamer");
      await this.addLevels(bot, 5, 6);
      await bot.command("valid06", "viewer", "reward-id-priority");

      await bot.command("!random", "streamer");

      expect(this.bookmarks).toEqual(["valid05"]);
    });

    it("only takes levels from the earliest possible round", async function() {
      const bot = this.buildBotInstance({config: { priority: "rotation" }});
      for (let i = 0; i < 10; i++) {
        await this.addLevels(bot, 2, (i * 2) + 1, `viewer0${i}`);
      }
      await bot.command("!mark", "streamer");
      for (let i = 0; i < 10; i++) {
        await bot.command("!add emp001", `viewer0${i}`);
      }

      await bot.command("!random", "streamer");

      expect(this.bookmarks).toEqual(["valid19"]);
    });

    it("doesn't read past markers to find the end of the round",
       async function() {
      const bot = this.buildBotInstance({config: { priority: "rotation" }});
      for (let i = 0; i < 5; i++) {
        await bot.command(`!add valid0${i}`, `viewer0${i}`);
      }
      await bot.command("!mark", "streamer");
      for (let i = 5; i < 10; i++) {
        await bot.command(`!add valid0${i}`, `viewer0${i}`);
      }
      for (let i = 0; i < 10; i++) {
        await bot.command(`!add valid1${i}`, `viewer0${i}`);
      }

      await bot.command("!random", "streamer");

      expect(this.bookmarks).toEqual(["valid04"]);
    });

    it("doesn't skip priority levels to non-priority levels in the same round",
       async function() {
      const bot = this.buildBotInstance({
        config: { priority: "rotation" },
        twitch: { rewardBehaviors: this.optionQueueJumpRewards }
      });
      for (let r = 0; r < 2; r++) {
        for (let i = 0; i < 5; i++) {
          await bot.command(`!add valid${r}${i}`, `viewer0${i}`);
        }
      }
      await bot.command("valid02", "viewer", "reward-id-priority");
      await bot.command("valid03", "viewer", "reward-id-priority");

      await bot.command("!random", "streamer");

      expect(this.bookmarks).toEqual(["valid03"]);
    });

    // arguably we could test every combination of round + priority + marker,
    // but at leats for now the above is convincing enough
  });

  it("when rolling minimum random values returns the first eligible level",
     async function() {
    this.setRandomizerToMin();

    const bot = this.buildBotInstance();
    await this.addLevels(bot, 10);

    await bot.command("!random", "streamer");

    expect(this.bookmarks).toEqual(["valid02"]);
  });

  it("updates the overlay", async function() {
    const bot = this.buildBotInstance({ config: {httpPort: 8080 }});
    await this.addLevels(bot, 2);
    const token = await this.openWebSocket("overlay/levels");

    const levelsMessage = (await Promise.all([
      bot.command("!random", "streamer"),
      this.waitForNextWsMessage(token)
    ]))[1];
    expect(levelsMessage).toEqual([{
      type: "level",
      entry: {
        id: "valid02",
        name: "Valid Level 02",
        type: "level",
        submittedBy: "viewer02"
      }
    }]);
  });

  it("only works for the streamer", async function() {
    const bot = this.buildBotInstance({ config: {httpPort: 8080 }});
    await this.addLevels(bot, 2);

    await bot.command("!random", "viewer");

    const queue = await this.getSimpleQueue();
    expect(queue.map(e => e.id)).toEqual(["valid01", "valid02"]);
  });
});
