const isPlaysALevel = require("../playLevel.template-spec");

describe("the !add command", () => {
  itPlaysALevel(1, (bot, user, id) => bot.command(`!add ${id}`, user));

  it("adds a level to the queue", async function() {
    const bot = this.buildBotInstance();

    await bot.command("!add valid01", "viewer");

    expect(this.bookmarks).toEqual(["valid01"]);
  });

  it("adds a creator code to the queue", async function() {
    const bot = this.buildBotInstance({config: { httpPort: 8080 }});

    await bot.command("!add emp001", "viewer");

    const queue = await this.getSimpleQueue();
    expect(queue).toEqual([{ type: "creator", id: "emp001" }]);
  });

  it("rejects levels that are already in the queue", async function() {
    const bot = this.buildBotInstance({config: { httpPort: 8080 }});

    await bot.command("!add valid01", "viewer1");
    await bot.command("!add valid01", "viewer2");

    const queue = await this.getQueue();
    expect(queue.map(e => ({
      id: e.entry.id,
      submittedBy: e.entry.submittedBy
    }))).toEqual([{id: "valid01", submittedBy: "viewer1"}]);
  });

  it("rejects levels that were already played this session", async function() {
    const bot = this.buildBotInstance();

    await bot.command("!add valid01", "viewer1");
    await bot.command("!next", "streamer");
    await bot.command("!add valid01", "viewer2");

    expect(this.bookmarks).toEqual([]);
  });

  it("rejects levels that were removed by the streamer", async function() {
    const bot = this.buildBotInstance();

    await bot.command("!add valid01", "viewer1");
    await bot.command("!add valid02", "viewer1");
    await bot.command("!add valid03", "viewer1");

    await bot.command("!remove valid02", "streamer");
    await bot.command("!remove valid03", "viewer1");
    await bot.command("!next", "streamer");

    await bot.command("!add valid02", "viewer1");
    await bot.command("!add valid03", "viewer1");

    expect(this.bookmarks).toEqual(["valid03"]);
  });

  it("updates the overlay", async function() {
    const bot = this.buildBotInstance({config: { httpPort: 8080 }});
    const token = await this.openWebSocket("overlay/levels");

    const msg = (await Promise.all([
      bot.command("!add valid01", "viewer"),
      this.waitForNextWsMessage(token)
    ]))[1];

    expect(msg).toEqual([{
      type: 'level',
      entry: {
        id: 'valid01',
        name: 'Valid Level 01',
        type: 'level',
        submittedBy: 'viewer'
      }
    }]);
  });
});
