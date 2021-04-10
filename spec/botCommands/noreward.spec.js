describe("the !noreward command", () => {
  it("removes a reward behavior", async function() {
    const bot = this.buildBotInstance({twitch: {rewardBehaviors: {
      "other-reward-id": "priority"
    }}});
    bot.command("!reward urgent", "streamer", "my-reward-id");

    bot.command("!noreward urgent", "streamer");

    expect(this.rewardBehaviors).toEqual({
      "my-reward-id": undefined,
      "other-reward-id": "priority"
    });
  });

  it("only works for the streamer", async function() {
    const bot = this.buildBotInstance({twitch: {rewardBehaviors: {
      "other-reward-id": "priority"
    }}});
    bot.command("!reward urgent", "streamer", "my-reward-id");

    bot.command("!noreward urgent", "viewer");

    expect(this.rewardBehaviors).toEqual({
      "my-reward-id": "urgent",
      "other-reward-id": "priority"
    });
  });
});
