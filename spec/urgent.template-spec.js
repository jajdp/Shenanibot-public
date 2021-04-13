// This template generates tests for the behaviors associated with marking a
// level as "urgent".

// Params:
// - cb(bot, levelId) : a callback which accepts a bot instance and a level
//   code as its parameters.  The callback should trigger the bot command or
//   function being tested in such a way that it will attempt to apply "urgent"
//   status to a level with the specified ID.  (The callback should not add the
//   specified level to the queue; it should assume the queue has already been
//   prepared for the test.)

const itPullsAQueuedLevel = require("./reward.template-spec.js");

module.exports = itHandlesLevelAsUrgent = cb => {
  itPullsAQueuedLevel(cb);

  describe("handles the level as urgent; so it", () => {
    describe("", () => {
      beforeEach(function() {
        this.bot = this.buildBotInstance({
          config: { httpPort: 8080 },
          twitch: { rewardBehaviors: this.optionQueueJumpRewards }
        });
      });

      it("moves a level to the next-to-play position", async function() {
        await this.addLevels(this.bot, 5);

        await cb(this.bot, "valid04")

        const queue = await this.getSimpleQueue();
        expect(queue).toEqual([
          { type: "level", id: "valid01" },
          { type: "level", id: "valid04" },
          { type: "level", id: "valid02" },
          { type: "level", id: "valid03" },
          { type: "level", id: "valid05" }
        ]);
      });

      it("moves a level past markers (except position #1)", async function() {
        await this.bot.command("!mark", "streamer");
        await this.bot.command("!add valid01", "viewer01");
        await this.bot.command("!mark", "streamer");
        await this.addLevels(this.bot, 4, 2);

        await cb(this.bot, "valid04")

        const queue = await this.getSimpleQueue();
        expect(queue).toEqual([
          { type: "mark", id: undefined },
          { type: "level", id: "valid04" },
          { type: "level", id: "valid01" },
          { type: "mark", id: undefined },
          { type: "level", id: "valid02" },
          { type: "level", id: "valid03" },
          { type: "level", id: "valid05" }
        ]);

        await this.bot.command("!next", "streamer");
        await this.bot.command("!next", "streamer");

        await cb(this.bot, "valid05")

        const queue2 = await this.getSimpleQueue();
        expect(queue2).toEqual([
          { type: "level", id: "valid01" },
          { type: "level", id: "valid05" },
          { type: "mark", id: undefined },
          { type: "level", id: "valid02" },
          { type: "level", id: "valid03" }
        ]);
      });

      it("doesn't move a level past other urgent levels", async function() {
        await this.addLevels(this.bot, 6);
        await this.bot.command("!mark", "streamer");
        await this.addLevels(this.bot, 3, 7);

        await this.bot.command("valid02", "viewer", "reward-id-urgent");
        await this.bot.command("!giveboost viewer", "streamer");
        await this.bot.command("!boost valid03", "viewer");
        // priority levels at the front of the qeuue are the same as urgent
        // (unless they're in a later round in a rotation)
        await this.bot.command("valid04", "viewer", "reward-id-priority");
        // expedited levels are not the same as urgent
        await this.bot.command("valid06", "viewer", "reward-id-expedite");
        // priority levels stuck behind markers are not the same as urgent
        await this.bot.command("valid09", "viewer", "reward-id-priority");

        await cb(this.bot, "valid07")

        const queue = await this.getSimpleQueue();
        expect(queue).toEqual([
          { type: "level", id: "valid01" },
          { type: "level", id: "valid02" },
          { type: "level", id: "valid03" },
          { type: "level", id: "valid04" },
          { type: "level", id: "valid07" },
          { type: "level", id: "valid06" },
          { type: "level", id: "valid05" },
          { type: "mark", id: undefined },
          { type: "level", id: "valid09" },
          { type: "level", id: "valid08" }
        ]);
      });

      it("moves past priority levels in later rounds", async function() {
        const bot = this.buildBotInstance({
          config: {
            httpPort: 8080,
            priority: "rotation"
          },
          twitch: { rewardBehaviors: this.optionQueueJumpRewards }
        });
        await this.addLevels(bot, 3, 1, "viewer0");
        await bot.command("valid02", "viewer0", "reward-id-priority");

        await cb(bot, "valid03")

        const queue = await this.getQueue();
        expect(queue.map(e => ({id: e.entry.id, round: e.entry.round})))
            .toEqual([
          {id: "valid01", round: 1},
          {id: "valid03", round: 1},
          {id: "valid02", round: 2},
        ]);
      });

      it("moves nothing if it can't move the level forward", async function() {
        await this.addLevels(this.bot, 3);
        await cb(this.bot, "valid02")
        await cb(this.bot, "valid03")

        const expected = [
          { type: "level", id: "valid01" },
          { type: "level", id: "valid02" },
          { type: "level", id: "valid03" }
        ]

        const queue = await this.getSimpleQueue();
        expect(queue).toEqual(expected);

        await cb(this.bot, "valid02")

        const queue2 = await this.getSimpleQueue();
        expect(queue2).toEqual(expected);
      });

      it("takes the first match for creator codes", async function() {
        await this.addLevels(this.bot, 2);
        await this.bot.command("!add emp001", "viewer");
        await this.bot.command("!add valid03", "viewer");
        await this.bot.command("!add emp001", "viewer");

        await cb(this.bot, "emp001");

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

    describe("updates the level round", function() {
      beforeEach(function() {
        this.bot = this.buildBotInstance({
          config: {
            httpPort: 8080,
            priority: "rotation",
            roundDuration: 1
          },
          twitch: { rewardBehaviors: this.optionQueueJumpRewards }
        });

        jasmine.clock().install();
      });

      afterEach(function() {
        jasmine.clock().uninstall();
      });

      it("when moving to position 2 behind a level", async function() {
        await this.bot.command("!add valid01", "viewer0");
        await this.bot.command("!add valid11", "viewer1");
        await this.bot.command("!add valid12", "viewer1");
        await this.bot.command("!add valid21", "viewer2");
        await this.bot.command("!add valid22", "viewer2");

        await cb(this.bot, "valid22")

        const queue = await this.getQueue();
        expect(queue[1].entry.round).toBe(1);
      });

      it("when moving to position 2 behind a marker", async function() {
        await this.bot.command("!mark", "streamer");
        await this.bot.command("!add valid11", "viewer1");
        await this.bot.command("!add valid12", "viewer1");
        await this.bot.command("!add valid21", "viewer2");
        await this.bot.command("!add valid22", "viewer2");

        await cb(this.bot, "valid22")

        const queue = await this.getQueue();
        expect(queue[1].entry.round).toBe(1);
      });

      it("even if the level wasn't moved", async function() {
        await this.bot.command("!add valid01", "viewer0");
        await this.bot.command("!add valid02", "viewer0");

        await cb(this.bot, "valid02")

        await this.bot.command("!add valid11", "viewer1");
        const queue = await this.getQueue();
        expect(queue.map(e => ({id: e.entry.id, round: e.entry.round})))
            .toEqual([
          {id: "valid01", round: 1},
          {id: "valid02", round: 1},
          {id: "valid11", round: 1},
        ]);
      });

      it("when moving a level into a previous round", async function() {
        await this.bot.command("!add valid01", "viewer0");
        await this.bot.command("!mark", "streamer");
        await this.bot.command("!next", "streamer");
        await this.addLevels(this.bot, 2, 2, "viewer0");

        jasmine.clock().tick(60000);
        await cb(this.bot, "valid03")

        const queue = await this.getQueue();
        expect(queue.slice(1)
            .map(e => ({id: e.entry.id, round: e.entry.round})))
            .toEqual([
          {id: "valid03", round: 1},
          {id: "valid02", round: 2}
        ]);
      });
    });
  });
};
