describe("ws://.../ui/creatorCode", () => {
  it("replaces the 'now playing' creator code with a specific level",
     async function() {
    const bot = this.buildBotInstance({config: {
      creatorCodeMode: "webui",
      httpPort: 8080
    }});
    await bot.command("!add emp001", "viewer");
    const token = await this.openWebSocket("ui/creatorCode");

    await this.sendWsMessage(token, {creatorId: "emp001", level: {
      id: "001l001",
      name: "test"
    }});

    const queue = await this.getQueue();
    expect(queue).toEqual([{
      type: "level",
      entry: {
        type: "level",
        id: "001l001",
        name: "test",
        submittedBy: "viewer"
      }
    }]);
  });

  it("only works on the 'now playing' entry", async function() {
    const bot = this.buildBotInstance({config: {
      creatorCodeMode: "webui",
      httpPort: 8080
    }});
    await bot.command("!add emp001", "viewer");
    await bot.command("!add emp001", "viewer");
    await bot.command("!add emp002", "viewer");
    const token = await this.openWebSocket("ui/creatorCode");

    await this.sendWsMessage(token, {creatorId: "emp002", level: {
      id: "002l001",
    }});
    let queue = await this.getSimpleQueue();
    expect(queue).toEqual([
      { type: "creator", id: "emp001" },
      { type: "creator", id: "emp001" },
      { type: "creator", id: "emp002" }
    ]);

    await this.sendWsMessage(token, {creatorId: "emp001", level: {
      id: "001l001",
    }});
    queue = await this.getSimpleQueue();
    expect(queue).toEqual([
      { type: "level", id: "001l001" },
      { type: "creator", id: "emp001" },
      { type: "creator", id: "emp002" }
    ]);
  });

  it("updates the overlay", async function() {
    const bot = this.buildBotInstance({config: {
      creatorCodeMode: "webui",
      httpPort: 8080
    }});
    await bot.command("!add emp001", "viewer");
    const uiToken = await this.openWebSocket("ui/creatorCode");
    const overlayToken = await this.openWebSocket("overlay/levels");

    const message = (await Promise.all([
      this.sendWsMessage(uiToken, {creatorId: "emp001", level: {
        id: "001l001",
        name: "test"
      }}),
      this.waitForNextWsMessage(overlayToken)
    ]))[1];

    expect(message).toEqual([{
      type: "level",
      entry: {
        id: "001l001",
        name: "test",
        type: "level",
        submittedBy: "viewer"
      }
    }]);
  });
});
