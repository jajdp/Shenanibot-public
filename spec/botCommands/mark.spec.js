describe("the !mark command", () => {
  it("occupies a spot in the queue", async function() {
    const bot = this.buildBotInstance();

    await bot.command("!mark", "streamer");

    await bot.command("!add valid01", "viewer");
    expect(this.bookmarks).toEqual([]);
    await bot.command("!next", "streamer");
    expect(this.bookmarks).toEqual(["valid01"]);
  });

  it("will not place back-to-back markers", async function() {
    const bot = this.buildBotInstance();

    await bot.command("!mark", "streamer");
    await bot.command("!mark", "streamer");

    await bot.command("!add valid01", "viewer");
    expect(this.bookmarks).toEqual([]);
    await bot.command("!next", "streamer");
    expect(this.bookmarks).toEqual(["valid01"]);
  });

  it("updates the overlay", async function() {
    const bot = this.buildBotInstance({config: { httpPort: 8080 }});
    const token = await this.openWebSocket('overlay/levels')

    const msg = (await Promise.all([
      bot.command("!mark", "streamer"),
      this.waitForNextWsMessage(token)
    ]))[1];

    expect(msg).toEqual([{type: "mark"}]);
  });

  it("only works for the streamer", async function() {
    const bot = this.buildBotInstance();

    await bot.command("!mark", "viewer");

    await bot.command("!add valid01", "viewer");
    expect(this.bookmarks).toEqual(["valid01"]);
  });
});
