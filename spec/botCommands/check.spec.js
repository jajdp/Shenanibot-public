describe("the !check command", () => {
  it("sees if you've beaten a level", async function() {
    const bot = this.buildBotInstance();

    const response = await bot.command("!check beaten1", "viewer");

    expect(response).toContain("has beaten");
  });

  it("sees if you've played a level", async function() {
    const bot = this.buildBotInstance();

    const response = await bot.command("!check played1", "viewer");

    expect(response).toContain("has played");
  });

  it("sees if you've not played a level", async function() {
    const bot = this.buildBotInstance();

    const response = await bot.command("!check valid01", "viewer");

    expect(response).toContain("has not played");
  });
});
