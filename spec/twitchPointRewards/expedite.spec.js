const itPullsAQueuedLevel = require("../reward.template-spec.js");

describe("the 'expedite' channel point reward", () => {
  itPullsAQueuedLevel(async (bot, levelId) => {
    await bot.command(levelId, "viewer", "reward-id-expedite");
  });

  describe("", () => {
    beforeEach(function() {
      this.bot = this.buildBotInstance({
        config: { httpPort: 8080 },
        twitch: { rewardBehaviors: this.optionQueueJumpRewards }
      });
    });

    it("moves a level forward one place in the queue", async function() {
      await this.addLevels(this.bot, 5);

      await this.bot.command("valid04", "viewer", "reward-id-expedite");

      const queue = await this.getSimpleQueue();
      expect(queue).toEqual([
        { type: "level", id: "valid01" },
        { type: "level", id: "valid02" },
        { type: "level", id: "valid04" },
        { type: "level", id: "valid03" },
        { type: "level", id: "valid05" }
      ]);
    });

    it("does not move a level past markers", async function() {
      await this.bot.command("!add valid01", "viewer01");
      await this.bot.command("!mark", "streamer");
      await this.bot.command("!add valid02", "viewer01");

      await this.bot.command("valid02", "viewer", "reward-id-priority");

      const queue = await this.getSimpleQueue();
      expect(queue).toEqual([
        { type: "level", id: "valid01" },
        { type: "mark", id: undefined },
        { type: "level", id: "valid02" }
      ]);
    });

    it("does not move non-urgent/priority levels past urgent/priority levels",
       async function() {
      await this.addLevels(this.bot, 3);
      this.bot.command("!mark", "streamer");
      await this.addLevels(this.bot, 2, 4);
      await this.bot.command("valid02", "viewer", "reward-id-urgent");
      await this.bot.command("valid04", "viewer", "reward-id-priority");

      await this.bot.command("valid03", "viewer", "reward-id-expedite");
      await this.bot.command("valid05", "viewer", "reward-id-expedite");

      const queue = await this.getSimpleQueue();
      expect(queue).toEqual([
        { type: "level", id: "valid01" },
        { type: "level", id: "valid02" },
        { type: "level", id: "valid03" },
        { type: "mark", id: undefined },
        { type: "level", id: "valid04" },
        { type: "level", id: "valid05" }
      ]);
    });

    it("moves urgent/priority levels past urgent/priority levels",
       async function() {
      await this.addLevels(this.bot, 3);
      await this.bot.command("valid02", "viewer", "reward-id-urgent");
      await this.bot.command("valid03", "viewer", "reward-id-priority");

      await this.bot.command("valid03", "viewer", "reward-id-expedite");
      await this.bot.command("valid02", "viewer", "reward-id-expedite");

      const queue = await this.getSimpleQueue();
      expect(queue).toEqual([
        { type: "level", id: "valid01" },
        { type: "level", id: "valid02" },
        { type: "level", id: "valid03" }
      ]);
    });

    it("moves levels past previously-expedited levels",
       async function() {
      await this.addLevels(this.bot, 3);
      await this.bot.command("valid03", "viewer", "reward-id-expedite");
      await this.bot.command("valid02", "viewer", "reward-id-expedite");

      const queue = await this.getSimpleQueue();
      expect(queue).toEqual([
        { type: "level", id: "valid01" },
        { type: "level", id: "valid02" },
        { type: "level", id: "valid03" }
      ]);
    });

    it("takes the first match for creator codes", async function() {
      await this.addLevels(this.bot, 2);
      await this.bot.command("!add emp001", "viewer");
      await this.bot.command("!add valid03", "viewer");
      await this.bot.command("!add emp001", "viewer");

      await this.bot.command("emp001", "viewer", "reward-id-expedite");

      const queue = await this.getSimpleQueue();
      expect(queue).toEqual([
        { type: "level", id: "valid01" },
        { type: "creator", id: "emp001" },
        { type: "level", id: "valid02" },
        { type: "level", id: "valid03" },
        { type: "creator", id: "emp001" }
      ]);
    });
  });

  it("does not move a level into a previous round", async function() {
    this.bot = this.buildBotInstance({
      config: {
        httpPort: 8080,
        priority: "rotation"
      },
      twitch: { rewardBehaviors: this.optionQueueJumpRewards }
    });

    await this.bot.command("!add valid01", "viewer0");
    await this.bot.command("!add valid11", "viewer1");
    await this.bot.command("!add valid12", "viewer1");
    await this.bot.command("!add valid21", "viewer2");
    await this.bot.command("!add valid22", "viewer2");

    await this.bot.command("valid12", "viewer", "reward-id-expedite");

    const queue = await this.getQueue();
    expect(queue.map(e => ({id: e.entry.id, round: e.entry.round}))).toEqual([
      { id: "valid01", round: 1 },
      { id: "valid11", round: 1 },
      { id: "valid21", round: 1 },
      { id: "valid12", round: 2 },
      { id: "valid22", round: 2 }
    ]);
  });
});
