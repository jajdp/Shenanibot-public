describe("the 'roundDuration' configuration option", () => {
  beforeEach(function() {
    jasmine.clock().install();
    this.bot = this.buildBotInstance({ config: {
      httpPort: 8080,
      priority: "rotation",
      roundDuration: 1
    }});
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it("limits how long each round accepts levels", async function() {
    jasmine.clock().tick(59999);
    await this.addLevels(this.bot, 4, 1, "viewer0");

    jasmine.clock().tick(59999);
    await this.bot.command("!add valid11", "viewer1");
    jasmine.clock().tick(1);
    await this.bot.command("!add valid21", "viewer2");
    jasmine.clock().tick(60000);
    await this.bot.command("!add valid31", "viewer3");

    const queue = await this.getSimpleQueue();
    expect(queue.map(e => e.id)).toEqual([
      "valid01",
      "valid11",
      "valid02",
      "valid21",
      "valid03",
      "valid31",
      "valid04",
    ]);
  });

  it("doens't start timing a round until that round has its first level",
     async function() {
    await this.bot.command("!add valid01", "viewer0");
    jasmine.clock().tick(119999);
    await this.addLevels(this.bot, 2, 2, "viewer0");

    jasmine.clock().tick(59999);
    await this.bot.command("!add valid11", "viewer1");

    const queue = await this.getSimpleQueue();
    expect(queue.map(e => e.id)).toEqual([
      "valid01",
      "valid02",
      "valid11",
      "valid03"
    ]);
  });

  it("times a round even if all levels have been removed", async function() {
    await this.addLevels(this.bot, 4, 1, "viewer0");
    await this.bot.command("!boost valid02", "streamer");

    jasmine.clock().tick(119999);
    await this.bot.command("!add valid11", "viewer1");
    jasmine.clock().tick(1);
    await this.bot.command("!add valid21", "viewer2");

    const queue = await this.getQueue();
    expect(queue.map(e => ({id: e.entry.id, round: e.entry.round}))).toEqual([
      {id: "valid01", round: 1},
      {id: "valid02", round: 1},
      {id: "valid11", round: 2},
      {id: "valid03", round: 3},
      {id: "valid21", round: 3},
      {id: "valid04", round: 4}
    ]);
  });
});
