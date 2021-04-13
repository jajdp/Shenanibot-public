// This template generates tests for the behaviors associated with locating a
// requested level in the queue for reward processing.

// Params:
// - cb(bot, levelId) : a callback which accepts a bot instance and a level
//   code as its parameters.  The callback should trigger the bot command or
//   function being tested in such a way that it will attempt to apply a reward
//   to a level with the specified ID.  (The callback should not add the
//   specified level to the queue; it should assume the queue has already been
//   prepared for the test.)

module.exports = itHandlesLevelAsUrgent = cb => {
  describe("needs a level from the queue; so it", () => {
    it("does nothing for the 1st entry, or invalid or missing codes",
                                                           async function() {
      const bot = this.buildBotInstance({
        config: { httpPort: 8080 },
        twitch: { rewardBehaviors: this.optionQueueJumpRewards }
      });

      await this.addLevels(bot, 3);
      const expectedQueue = await this.getSimpleQueue();
      const checkUnchanged = async () => {
        const queue = await this.getSimpleQueue();
        expect(queue).toEqual(expectedQueue);
      };

      await cb(bot, "valid01");
      await checkUnchanged();
      await cb(bot, "invalid01");
      await checkUnchanged();
      await cb(bot, "valid10");
      await checkUnchanged();
    });
  });
};
