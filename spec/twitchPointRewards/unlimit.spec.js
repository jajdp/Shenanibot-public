describe("the 'unlimit' channel point reward", () => {
  it("allows a submission beyond a session level limit", async function() {
    const bot = this.buildBotInstance({
      config: {
        levelLimitType: "session",
        levelLimit: 1
      },
      twitch: {
        rewardBehaviors: {"reward-id-unlimit": "unlimit"}
      }
    });
    await bot.command("!add valid01", "viewer");
    await bot.command("!next", "streamer");

    await bot.command("!add valid02", "viewer", "reward-id-unlimit");
    expect(this.bookmarks).toEqual(["valid02"]);
  });

  it("allows a submission beyond an active level limit", async function() {
    const bot = this.buildBotInstance({
      config: {
        levelLimitType: "active",
        levelLimit: 1
      },
      twitch: {
        rewardBehaviors: {"reward-id-unlimit": "unlimit"}
      }
    });
    await bot.command("!add valid01", "viewer");
    await bot.command("!add valid02", "viewer", "reward-id-unlimit");
    await bot.command("!next", "streamer");

    expect(this.bookmarks).toEqual(["valid02"]);
  });

  it("works when there is an add reward", async function() {
    const bot = this.buildBotInstance({
      config: {
        levelLimitType: "active",
        levelLimit: 1
      },
      twitch: {
        rewardBehaviors: {
          "reward-id-add": "add",
          "reward-id-unlimit": "unlimit"
        }
      }
    });
    await bot.command("!add valid01", "viewer", "reward-id-add");
    await bot.command("!add valid03", "viewer", "reward-id-add");
    await bot.command("!add valid02", "viewer", "reward-id-unlimit");
    await bot.command("!next", "streamer");

    expect(this.bookmarks).toEqual(["valid02"]);
  });
});
