const itDequeues = require("../dequeue.template-spec");
const itPlaysALevel = require("../playLevel.template-spec");

describe("the !next command", () => {
  const cb = async bot => await bot.command("!next", "streamer");
  itDequeues(cb);
  itPlaysALevel(2, cb);

  it("updates the overlay", async function() {
    const bot = this.buildBotInstance({ config: {httpPort: 8080 }});
    await this.addLevels(bot, 2);
    const token = await this.openWebSocket("overlay/levels");

    const levelsMessage = (await Promise.all([
      bot.command("!next", "streamer"),
      this.waitForNextWsMessage(token)
    ]))[1];
    expect(levelsMessage).toEqual([{
      type: "level",
      entry: {
        id: "valid02",
        name: "Valid Level 02",
        type: "level",
        submittedBy: "viewer02"
      }
    }]);
  });

  it("only works for the streamer", async function() {
    const bot = this.buildBotInstance({ config: {httpPort: 8080 }});
    await this.addLevels(bot, 2);

    await bot.command("!next", "viewer");

    const queue = await this.getSimpleQueue();
    expect(queue.map(e => e.id)).toEqual(["valid01", "valid02"]);
  });
});
