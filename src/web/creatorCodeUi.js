const httpServer = require("./server");

const wsUrl = "/ui/creatorCode";
let onLevelSelected = (c,l) => undefined;
let creatorInfo = null;

const initCreatorInfo = () => {
  creatorInfo = {
    creatorId: null,
    name: null,
    levels: []
  }
};

const infoMessage = () => JSON.stringify({
  ...creatorInfo,
  type: 'info'
});

module.exports = {
  init: levelCb => {
    onLevelSelected = levelCb;
    initCreatorInfo();
    const config = httpServer.getConfig();

    console.log( `Keep a browser at http://localhost:${config.httpPort}/ui/creatorCode.html to\n`
               + 'control handling of creator codes.'); 

    httpServer.register(wsUrl, ws => {
      ws.send(infoMessage());
    }, msg => {
      const data = JSON.parse(msg);
      if(levelCb(data.creatorId, data.level)) {
        initCreatorInfo();
        httpServer.broadcast(wsUrl, infoMessage());
      }
    });
  },

  setCreatorInfo: newCreatorInfo => {
    creatorInfo = newCreatorInfo;
    creatorInfo.levels = creatorInfo.levels || [];
    httpServer.broadcast(wsUrl, infoMessage());
  },

  addLevelsToCreatorInfo: levels => {
    creatorInfo.levels = creatorInfo.levels.concat(levels);
    httpServer.broadcast(wsUrl, JSON.stringify({
      levels,
      type: 'levels'
    }));
  },

  clearCreatorInfo: () => {
    initCreatorInfo();
    httpServer.broadcast(wsUrl, infoMessage());
  }
};
