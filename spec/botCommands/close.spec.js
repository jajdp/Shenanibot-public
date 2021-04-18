describe("the !close command", () => {
  it("prevents !add commands", async function() {
    const bot = this.buildBotInstance();

    const response = await bot.command("!close", "streamer");
    expect(typeof response).toBe("string");
    expect(response).not.toBe("");

    await bot.command("!add valid01", "viewer");
    expect(this.bookmarks).toEqual([]);
  });

  it("only works for the streamer", async function() {
    const bot = this.buildBotInstance();

    const response = await bot.command("!close", "viewer");
    expect(response).toBeFalsy();
    console.log(await bot.command("!add valid01", "viewer"));
    expect(this.bookmarks).toEqual(["valid01"]);
  });

  it("sends status to the overlay module", async function() {
    const bot = this.buildBotInstance({config: {httpPort: 8080}});
    const statusToken = await this.openWebSocket("overlay/status");

    const statusMsg = (await Promise.all([
      bot.command("!close", "streamer"),
      this.waitForNextWsMessage(statusToken)
    ]))[1];

    expect(statusMsg.status).toEqual("closed");
  });
});
