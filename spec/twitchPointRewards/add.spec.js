describe("the 'add' channel point reward", () => {
  it("prevents adding levels without using the reward", async function() {
    const bot = this.buildBotInstance({twitch: {
      rewardBehaviors: {"reward-id-add": "add"}
    }});

    await bot.command("!add valid01", "viewer");
    expect(this.bookmarks).toEqual([]);

    await bot.command("!add valid02", "viewer", "reward-id-add");
    expect(this.bookmarks).toEqual(["valid02"]);
  });

  it("does not require the !add keyword", async function() {
    const bot = this.buildBotInstance({twitch: {
      rewardBehaviors: {"reward-id-add": "add"}
    }});

    await bot.command("valid02", "viewer", "reward-id-add");
    expect(this.bookmarks).toEqual(["valid02"]);
  });

  it("does not affect the streamer", async function() {
    const bot = this.buildBotInstance({twitch: {
      rewardBehaviors: {"reward-id-add": "add"}
    }});

    await bot.command("!add valid01", "streamer");
    expect(this.bookmarks).toEqual(["valid01"]);
  });
});
