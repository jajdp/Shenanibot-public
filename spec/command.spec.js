describe("the command method", () => {
  it("treats any amount of whitespace like a single space", async function() {
    const bot = this.buildBotInstance();

    await bot.command("!add  valid01", "viewer01");

    expect(this.bookmarks).toEqual(["valid01"]);
  });

  it("is case-insensitive for command names", async function() {
    const bot = this.buildBotInstance();
    
    await bot.command("!aDd valid01", "viewer01");

    expect(this.bookmarks).toEqual(["valid01"]);
  });
});
