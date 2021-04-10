describe("the !reward command", () => {
  it("registers a reward behavior", async function() {
    const bot = this.buildBotInstance();

    await bot.command("!reward urgent", "streamer", "my-reward-id");

    expect(this.rewardBehaviors).toEqual({"my-reward-id": "urgent"});
  });

  it("will not change the behavior of a registered reward", async function() {
    const bot = this.buildBotInstance();
    await bot.command("!reward add", "streamer", "my-reward-id");

    await bot.command("!reward urgent", "streamer", "my-reward-id");

    expect(this.rewardBehaviors).toEqual({"my-reward-id": "add"});
  });

  it("will not register two rewards for the same behavior", async function() {
    const bot = this.buildBotInstance();
    await bot.command("!reward urgent", "streamer", "other-reward-id");

    await bot.command("!reward urgent", "streamer", "my-reward-id");

    expect(this.rewardBehaviors).toEqual({"other-reward-id": "urgent"});
  });

  it("only works for the streamer", async function() {
    const bot = this.buildBotInstance();

    await bot.command("!reward urgent", "viewer", "my-reward-id");

    expect(this.rewardBehaviors).toEqual({});
  });
});
