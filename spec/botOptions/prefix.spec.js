describe("the 'prefix' configuration option", () => {
  it("sets the command prefix", async function() {
    const bot = this.buildBotInstance({config: { prefix: "$" }});

    await bot.command("!add valid01", "viewer");
    await bot.command("$add valid02", "viewer");

    expect(this.bookmarks).toEqual(["valid02"]);
  });
});
