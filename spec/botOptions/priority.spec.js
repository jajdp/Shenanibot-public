describe("the 'priority' configuration option", () => {
  describe("when set to 'fifo'", () => {
    it("adds new levels to the end of the qeuue", async function() {
      const bot = this.buildBotInstance({config: {
        httpPort: 8080,
        priority: "fifo"
      }});

      await this.addLevels(bot, 5, 1, "viewer1");
      await bot.command("!add valid11", "viewer2");

      const queue = await this.getSimpleQueue();
      expect(queue[queue.length - 1].id).toEqual("valid11");
    });
  });

  describe("when set to 'rotation'", () => {
    it("adds new levels in rounds", async function() {
      const bot = this.buildBotInstance({config: {
        httpPort: 8080,
        priority: "rotation"
      }});

      await this.addLevels(bot, 5, 1, "viewer0");
      await bot.command("!add valid11", "viewer1");
      let queue = await this.getSimpleQueue();
      expect(queue[1].id).toEqual("valid11");

      await bot.command("!add valid12", "viewer1");
      queue = await this.getSimpleQueue();
      expect(queue[3].id).toEqual("valid12");

      await bot.command("!add valid21", "viewer2");
      await bot.command("!add valid06", "viewer0");
      queue = await this.getSimpleQueue();
      expect(queue[2].id).toEqual("valid21");
      expect(queue[4].id).toEqual("valid12");
      expect(queue[queue.length - 1].id).toEqual("valid06");
    });

    it("leaves markers in their previous positions", async function() {
      const bot = this.buildBotInstance({config: {
        httpPort: 8080,
        priority: "rotation"
      }});
      await this.addLevels(bot, 2, 1, "viewer0");
      await bot.command("!mark", "streamer");
      await this.addLevels(bot, 3, 3, "viewer0");

      await bot.command("!add valid11", "viewer1");

      const queue = await this.getSimpleQueue();
      expect(queue).toEqual([
        {type: "level", id: "valid01"},
        {type: "level", id: "valid11"},
        {type: "mark", id: undefined},
        {type: "level", id: "valid02"},
        {type: "level", id: "valid03"},
        {type: "level", id: "valid04"},
        {type: "level", id: "valid05"},
      ]);
    });
  });
});
