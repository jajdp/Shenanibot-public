describe("the !remove command", () => {
  it("removes a level from the queue", async function() {
    const bot = this.buildBotInstance();
    await bot.command("!add valid01", "viewer");
    await bot.command("!add valid02", "viewer");

    await bot.command("!remove valid02", "viewer");

    await bot.command("!next", "streamer");
    expect(this.bookmarks).toEqual([]);
  });

  it("won't remove the 'now playing' level", async function() {
    const bot = this.buildBotInstance();
    await bot.command("!add valid01", "viewer");

    await bot.command("!remove valid01", "viewer");

    expect(this.bookmarks).toEqual(["valid01"]);
  });

  it("won't let one viewer remove another viewer's level", async function() {
    const bot = this.buildBotInstance();
    await bot.command("!add valid01", "viewer");
    await bot.command("!add valid02", "viewer");

    await bot.command("!remove valid02", "viewer2");

    await bot.command("!next", "streamer");
    expect(this.bookmarks).toEqual(["valid02"]);
  });

  it("allows the streamer to remove any level", async function() {
    const bot = this.buildBotInstance();
    await bot.command("!add valid01", "viewer");
    await bot.command("!add valid02", "viewer");

    await bot.command("!remove valid02", "streamer");

    await bot.command("!next", "streamer");
    expect(this.bookmarks).toEqual([]);
  });

  it("decreases the subbitter's level count", async function() {
    const bot = this.buildBotInstance({config: {
      levelLimitType: "session",
      levelLimit: 1
    }});
    await bot.command("!add valid01", "viewer1");
    await bot.command("!add valid02", "viewer2");

    await bot.command("!remove valid02", "viewer2");

    await bot.command("!add valid03", "viewer2");
    await bot.command("!next", "streamer");
    expect(this.bookmarks).toEqual(["valid03"]);
  });

  it("advances the viewer's other levels to fill rounds", async function() {
    const bot = this.buildBotInstance({config: {
      httpPort: 8080,
      priority: "rotation"
    }});
    await bot.command("!add valid01", "viewer0");
    await bot.command("!add valid02", "viewer0");
    await bot.command("!add valid03", "viewer0");
    await bot.command("!add valid04", "viewer0");
    await bot.command("!add valid05", "viewer0");
    await bot.command("!add valid11", "viewer1");
    await bot.command("!add valid12", "viewer1");
    await bot.command("!add valid13", "viewer1");
    await bot.command("!add valid14", "viewer1");

    await bot.command("!remove valid11", "viewer1");

    await bot.command("!add valid15", "viewer1");
    const queue = await this.getSimpleQueue();
    expect(queue.map(e => e.id)).toEqual([
      "valid01", "valid12",
      "valid02", "valid13",
      "valid03", "valid14",
      "valid04", "valid15",
      "valid05"
    ]);
  });

  it("updates the overlay", async function () {
    const bot = this.buildBotInstance({config: { httpPort: 8080 }});
    await bot.command("!add valid01", "viewer");
    await bot.command("!add valid02", "viewer");
    const token = await this.openWebSocket("overlay/levels");

    const msg = (await Promise.all([
      bot.command("!remove valid02", "viewer"),
      this.waitForNextWsMessage(token)
    ]))[1];

    expect(msg).toEqual([{
      type: 'level',
      entry: {
        id: 'valid01',
        name: 'Valid Level 01',
        type: 'level',
        submittedBy: 'viewer'
      }
    }]);
  });
});
