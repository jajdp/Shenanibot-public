const httpServer = require("./server");

const statusUrl = '/overlay/status';
const levelsUrl = '/overlay/levels';

const state = {
    prefix: "",
    acceptCreatorCode: false,
    levels: "[]",
    status: ""
};

const setStatus = open => {
    state.status = (JSON.stringify({
        status: open ? "open" : "closed",
        command: `${state.prefix}add`,
        acceptCreatorCode: state.acceptCreatorCode
    }));
};

module.exports = {
  init: () => {
    const config = httpServer.getConfig();
    state.prefix = config.prefix;
    state.acceptCreatorCode = config.creatorCodeMode !== 'reject';
    setStatus(true);

    console.log(`Go to http://localhost:${config.httpPort}/overlay/ for overlay setup instructions`);

    httpServer.register(levelsUrl, ws => {
      ws.send(state.levels);
    });
    httpServer.register(statusUrl, ws => {
      ws.send(state.status);
    });
  },

  sendStatus: open => {
    setStatus(open);
    httpServer.broadcast(statusUrl, state.status);
  },

  sendLevels: queue => {
    state.levels = JSON.stringify(queue.map(e => ({
      type: e ? e.type : "mark",
      entry: e || undefined
    })));
    httpServer.broadcast(levelsUrl, state.levels);
  }
};
