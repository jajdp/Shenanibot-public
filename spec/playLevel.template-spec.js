// This template generates tests for behaviors to be applied when a level
// reaches the top of the queue (the "now playing" position).

// Params:
// - n : a position in the queue
// - cb(bot, username, levelId) : a callback that accepts a bot instance as
//   its 1st parameter, a username as its 2nd parameter, and a level ID as its
//   3rd parameter.  The callback should trigger the bot command or function
//   being tested, whose expected behavior depends on the queue position
//   identified by n:
//   - if n === 1, then the bot passed to cb() will have an empty queue, and
//     the command/function triggered by cb() should add a level to fill
//     position 1 in the queue.  The level ID and submitter should match the
//     other parameters passed to cb().
//   - If n > 1, then the queue will be pre-populated; the level at position
//     n will match the id passed to cb(), and it will be the only level
//     submitted by the username passed to cb().  The command/function
//     triggered by cb() should move the level from the nth position in the
//     queue to the "now playing" position.  (The now playing position itself
//     is postiion 1.)

module.exports = itPlaysALevel = (n, cb) => {
  describe("changes the 'now playing' entry, so", () => {
    describe("if the new 'now playing' entry is a level, it", () => {
      it("bookmarks the level", async function() {
        const bot = this.buildBotInstance();
        if (n > 1) {
          await this.addLevels(bot, n - 1);
          await bot.command("!add valid00", "viewer0");
          await this.addLevels(bot, 2, n);
        }

        await cb(bot, "viewer0", "valid00");

        expect(this.bookmarks).toContain("valid00");
      });

      it("updates the creator code cache", async function() {
        const bot = this.buildBotInstance({config: {
          httpPort: 8080,
          creatorCodeMode: "webui"
        }});
        await bot.command("!add emp001", "viewer");
        if (n > 1) {
          await this.addLevels(bot, n - 2);
          await bot.command("!add 001l001", "viewer0");
          await this.addLevels(bot, 2, n);
        } else {
          await bot.command("!next", "streamer");
        }

        await cb(bot, "viewer0", "001l001");

        await bot.command("!add emp001", "viewer");
        await bot.command("!play last from viewer", "streamer");
        const creatorInfo = await this.getCreatorInfo();
        expect(creatorInfo.levels[0].played).toBeTruthy();
      });
    });

    describe("if the new 'now playing' entry is a creator code, it", () => {
      it("updates the clipboard if configured to do so", async function() {
        const bot = this.buildBotInstance({config: {
          creatorCodeMode: "clipboard"
        }});
        if (n > 1) {
          await this.addLevels(bot, n - 2);
          await bot.command("!add emp001", "viewer");
          await bot.command("!add emp002", "viewer0");
          await bot.command("!add emp003", "viewer");
        }

        await cb(bot, "viewer0", "emp002");

        expect(this.clipboard.content).toEqual("emp002");
      });

      it("sends a websocket update if configured to do so", async function() {
        const bot = this.buildBotInstance({config: {
          httpPort: 8080,
          creatorCodeMode: "webui"
        }});
        if (n > 1) {
          await this.addLevels(bot, n - 2);
          await bot.command("!add emp001", "viewer");
          await bot.command("!add emp002", "viewer0");
          await bot.command("!add emp003", "viewer");
        }

        await cb(bot, "viewer0", "emp002");

        const creatorInfo = await this.getCreatorInfo();
        expect(creatorInfo.creatorId).toEqual("emp002");
        expect(creatorInfo.name).toEqual("EmployEE 002");
        expect(creatorInfo.levels.map(l => l.id))
                                              .toEqual(["002l001", "002l002"]);
      });

      it("takes time to load all the level data for a new creator code",
         async function() {
        jasmine.clock().install();
        const bot = this.buildBotInstance({config: {
          httpPort: 8080,
          creatorCodeMode: "webui"
        }});
        if (n > 1) {
          await this.addLevels(bot, n - 2);
          await bot.command("!add emp001", "viewer");
          await bot.command("!add emp200", "viewer0");
          await bot.command("!add emp003", "viewer");
        }

        await cb(bot, "viewer0", "emp200");

        let creatorInfo = await this.getCreatorInfo();
        expect(creatorInfo.levels.length).toBe(128);

        jasmine.clock().tick(1000);

        creatorInfo = await this.getCreatorInfo();
        expect(creatorInfo.levels.length).toBe(200);

        jasmine.clock().uninstall();
      });

      it("caches the level data for a creator code", async function() {
        const buildQueue = async () => {
          if (n > 1) {
            for (let i = 1; i < n; i++) {
              await bot.command("!add emp001", "viewer");
            }
            await bot.command("!add emp200", "viewer0");
            await bot.command("!add emp003", "viewer");
          }
        }

        jasmine.clock().install();
        const bot = this.buildBotInstance({config: {
          httpPort: 8080,
          creatorCodeMode: "webui"
        }});
        await buildQueue();
        await cb(bot, "viewer0", "emp200");
        jasmine.clock().tick(1000);
        const queue = await this.getSimpleQueue();
        for (const entry of queue) {
          await bot.command("!next", "streamer");
        }
        await buildQueue();

        await cb(bot, "viewer0", "emp200");

        creatorInfo = await this.getCreatorInfo();
        expect(creatorInfo.levels.length).toBe(200);

        jasmine.clock().uninstall();
      });
    });
  });
};
