// This template generates tests for behaviors associated with removal of a
// level from the queue after that level has been played.

// Params:
// - cb(bot, username) : a callback that accepts a bot instance as its 1st
//   parameter and a username as its 2nd parameter.  The callback should
//   trigger the bot command or function being tested, which is expected to
//   remove the "now playing" level.  The bot will already have its queue
//   initialized in a manner consistent with the other parameters.  (In all
//   cases, there will be a level in the "now playing" position submitted
//   by the user specified in the username parameter.)
// - nextPosition : the position in the queue that would be promoted to the
//   "now playing" position when cb() is called.
// - nextRequired : if truthy, cb() may assume there will be a level in
//   nextPosition with id "valid00"; it will be the only level other than
//   the "now playing" level submitted by "viewer0".  If nextRequired is
//   false, then tests that don't depend on the next level will not place
//   any level at nextPosition.
// - updateCurrentRound : a boolean indicating how the command updates the
//   round (in rotation priority mode) in the event that the entry moving
//   into the "now playing" position is not from the current round.  If true,
//   the current round should be increased to match the new "now playing"
//   level; if false, the new "now playing" level should be moved into the
//   current round

module.exports = async (cb, nextPosition = 2, nextRequired = false,
                        updateCurrentRound = true) => {
  let addLevels;
  const buildQueue = async (bot, withNext, firstCode = "valid01") => {
    await bot.command(`!add ${firstCode}`, "viewer0");

    if (withNext || nextRequired) {
      addLevels(bot, nextPosition - 2, 2);
      await bot.command("!add valid00", "viewer0");
    }
  };

  beforeAll(function() {addLevels = this.addLevels;});

  describe("dequeues an entry, so it", () => {
    it("clears the bookmark if dequeueing a level", async function() {
      const bot = this.buildBotInstance();
      await buildQueue(bot);
      expect(this.bookmarks).toContain("valid01");

      await cb(bot, "viewer0");

      expect(this.bookmarks).not.toContain("valid01");
    });

    it("decreases viewer level count for active limits", async function() {
      const bot = this.buildBotInstance({ config: {
        httpPort: 8080,
        levelLimit: nextRequired ? 2 : 1,
        levelLimitType: "active"
      }});
      await buildQueue(bot);

      await cb(bot, "viewer0");
      await bot.command("!add 001l001", "viewer0");

      const queue = await this.getSimpleQueue();
      expect(queue[queue.length - 1].id).toEqual("001l001");
    });

    it("keeps the round consistent", async function() {
      const bot = this.buildBotInstance({
        config: {
          creatorCodeMode: "webui",
          httpPort: 8080,
          priority: "rotation"
        }
      });
      await buildQueue(bot, true);

      await cb(bot, "viewer0");

      if (updateCurrentRound) {
        await bot.command("!add 001l001", "newviewer");
        const queue = await this.getQueue();
        expect(queue[queue.length - 1].entry.round).toEqual(2);
      } else {
        const queue = await this.getQueue();
        expect(queue[0].entry.round).toEqual(1);
      }
    });

    it("clears the creator code UI", async function() {
      const bot = this.buildBotInstance({
        config: {
          creatorCodeMode: "webui",
          httpPort: 8080
        }
      });
      await buildQueue(bot, false, "emp001");
      const token = await this.openWebSocket("ui/creatorCode");

      const wsMsg = (await Promise.all([
        cb(bot, "viewer0"),
        this.waitForNextWsMessage(token)
      ]))[1];

      expect(wsMsg).toEqual({
        type: "info",
        creatorId: null,
        name: null,
        levels: []
      });
    });
  });
};
