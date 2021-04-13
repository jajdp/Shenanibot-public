describe("the levelLimit configuration option", () => {
  it("applies a session limit to the number of entries a viewer can submit",
     async function() {
    const bot = this.buildBotInstance({config: {
      levelLimit: 1,
      levelLimitType: "session"
    }});

    await bot.command("!add valid01", "viewer1");
    await bot.command("!next", "streamer");

    await bot.command("!add valid02", "viewer1");
    expect(this.bookmarks).toEqual([]);

    await bot.command("!add valid02", "viewer2");
    expect(this.bookmarks).toEqual(["valid02"]);
  });

  it("applies an active limit to the # a viewer can have in the queue",
     async function() {
    // note - various dequeue methods of removing a level are tested in the
    // dequeue template spec to make sure they decrease the viewer's level
    // count for active limits
    const bot = this.buildBotInstance({config: {
      levelLimit: 1,
      levelLimitType: "active"
    }});

    await bot.command("!add valid01", "viewer1");
    await bot.command("!add valid02", "viewer1");
    await bot.command("!next", "streamer");
    expect(this.bookmarks).toEqual([]);

    await bot.command("!add valid02", "viewer1");
    expect(this.bookmarks).toEqual(["valid02"]);

    await bot.command("!add valid03", "viewer2");
    await bot.command("!remove valid03", "viewer2");
    await bot.command("!add valid04", "viewer2");

    await bot.command("!next", "streamer");
    expect(this.bookmarks).toEqual(["valid04"]);
  });

  it("does not affect the streamer", async function() {
    const bot = this.buildBotInstance({config: {
      levelLimit: 1,
      levelLimitType: "session"
    }});

    await bot.command("!add valid01", "streamer");
    await bot.command("!add valid02", "streamer");
    await bot.command("!next", "streamer");

    expect(this.bookmarks).toEqual(["valid02"]);
  });
});
