describe("the !permit command", () => {
  beforeEach(function() {
    this.bot = this.buildBotInstance({config: {
      httpPort: 8080,
      levelLimitType: "active",
      levelLimit: 1
    }});
  });

  it("allows a specific viewer to submit once when closed", async function() {
    await this.bot.command("!close", "streamer");

    await this.bot.command("!permit viewer2", "streamer");
    await this.bot.command("!add valid01", "viewer1");
    await this.bot.command("!add valid02", "viewer2");
    await this.bot.command("!add valid03", "viewer2");

    const queue = await this.getSimpleQueue();
    expect(queue).toEqual([{ type: "level", id: "valid02" }]);
  });

  it("allows a specific viewer to submit once over limit", async function() {
    await this.bot.command("!add valid01", "viewer1");
    await this.bot.command("!add valid02", "viewer2");

    await this.bot.command("!permit viewer2", "streamer");
    await this.bot.command("!add valid03", "viewer1");
    await this.bot.command("!add valid04", "viewer2");
    await this.bot.command("!add valid05", "viewer2");

    const queue = await this.getSimpleQueue();
    expect(queue).toEqual([
      { type: "level", id: "valid01" },
      { type: "level", id: "valid02" },
      { type: "level", id: "valid04" }
    ]);
  });

  it("has no effect if the viewer could already submit", async function() {
    console.log(await this.bot.command("!permit viewer", "streamer"));
    console.log(await this.bot.command("!close", "streamer"));
    console.log(await this.bot.command("!add valid01", "viewer"));

    const queue = await this.getSimpleQueue();
    expect(queue).toEqual([]);
  });

  it("ignores a leading @ in the username", async function() {
    await this.bot.command("!close", "streamer");

    const response1 = await this.bot.command("!permit @viewer", "streamer");
    await this.bot.command("!add valid01", "viewer");
    const queue = await this.getSimpleQueue();
    expect(queue).toEqual([{ type: "level", id: "valid01" }]);

    const response2 = await this.bot.command("!permit viewer", "streamer");
    expect(response1).toEqual(response2);
  });

  it("only works for the streamer", async function() {
    await this.bot.command("!close", "streamer");

    const response = await this.bot.command("!permit viewer2", "viewer1");
    expect(response).toBeFalsy();

    await this.bot.command("!add valid01", "viewer2");
    const queue = await this.getSimpleQueue();
    expect(queue).toEqual([]);
  });
});
