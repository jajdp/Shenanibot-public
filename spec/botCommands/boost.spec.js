const itHandlesLevelAsUrgent = require("../urgent.template-spec");

describe("the !boost command", () => {
  itHandlesLevelAsUrgent(async (bot, levelId) => {
    await bot.command("!giveboost viewer", "streamer");
    await bot.command(`!boost ${levelId}`, "viewer");
  });

  describe("", () => {
    beforeEach(async function() {
      this.bot = this.buildBotInstance({
        config: { httpPort: 8080 },
        twitch: { rewardBehaviors: this.optionQueueJumpRewards }
      });
      await this.addLevels(this.bot, 3);
    });

    it("requires streamer permission if used by viewers", async function() {
      await this.bot.command("!boost valid03", "viewer");

      const queue = await this.getSimpleQueue();
      expect(queue).toEqual([
        { type: "level", id: "valid01" },
        { type: "level", id: "valid02" },
        { type: "level", id: "valid03" }
      ]);
    });

    it("ignores leading @ in username when granting permission",
                                                          async function() {
      await this.bot.command("!giveboost @viewer", "streamer");
      await this.bot.command("!boost valid03", "viewer");

      const queue = await this.getSimpleQueue();
      expect(queue).toEqual([
        { type: "level", id: "valid01" },
        { type: "level", id: "valid03" },
        { type: "level", id: "valid02" }
      ]);
    });

    it("will not accept permission from anyone but the streamer",
                                                          async function() {
      await this.bot.command("!giveboost @viewer", "viewer2");
      await this.bot.command("!boost valid03", "viewer");

      const queue = await this.getSimpleQueue();
      expect(queue).toEqual([
        { type: "level", id: "valid01" },
        { type: "level", id: "valid02" },
        { type: "level", id: "valid03" }
      ]);
    });

    it("works for the streamer automatically", async function() {
      await this.bot.command("!boost valid03", "streamer");

      const queue = await this.getSimpleQueue();
      expect(queue).toEqual([
        { type: "level", id: "valid01" },
        { type: "level", id: "valid03" },
        { type: "level", id: "valid02" }
      ]);
    });
  });
})
