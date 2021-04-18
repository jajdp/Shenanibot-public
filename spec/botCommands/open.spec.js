describe("the !open command", () => {
  it("allows !add commands", async function() {
    const bot = this.buildBotInstance();
    await bot.command("!close", "streamer");

    const response = await bot.command("!open", "streamer");
    expect(typeof response).toBe("string");
    expect(response).not.toBe("");

    await bot.command("!add valid01", "viewer");
    expect(this.bookmarks).toEqual(["valid01"]);
  });

  it("only works for the streamer", async function() {
    const bot = this.buildBotInstance();
    await bot.command("!close", "streamer");

    const response = await bot.command("!open", "viewer");
    expect(response).toBeFalsy();
    await bot.command("!add valid01", "viewer");
    expect(this.bookmarks).toEqual([]);
  });

  it("sends status to the overlay module", async function() {
    const bot = this.buildBotInstance({config: {httpPort: 8080}});
    const statusToken = await this.openWebSocket("overlay/status");

    const statusMsg = (await Promise.all([
      bot.command("!open", "streamer"),
      this.waitForNextWsMessage(statusToken)
    ]))[1];

    expect(statusMsg).toEqual({
      status: "open",
      command: "!add",
      acceptCreatorCode: true
    });
  });
});
