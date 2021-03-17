const httpServer = require("./server");

const state = {
    prefix: "",
    levels: "[]",
    status: ""
};

const clients = {};

const setStatus = open => {
    state.status = (JSON.stringify({
        status: open ? "open" : "closed",
        command: `${state.prefix}add`
    }));
};

module.exports = {
  init: () => {
    const config = httpServer.getConfig();
    state.prefix = config.prefix;
    setStatus(true);

    console.log(`Go to http://localhost:${config.httpPort}/overlay/ for overlay setup instructions`);

    clients.levels = httpServer.register('/overlay/levels', ws => {
      ws.send(state.levels);
    });
    clients.status = httpServer.register('/overlay/status', ws => {
      ws.send(state.status);
    });
  },

  sendStatus: open => {
    setStatus(open);
    for (const ws of clients.status) {
      ws.send(state.status);
    }
  },

  sendLevels: queue => {
    state.levels = JSON.stringify(queue.map(e => ({
      type: e ? e.type : "mark",
      entry: e || undefined
    })));
    for (const ws of clients.levels) {
      ws.send(state.levels);
    }
  }
};
