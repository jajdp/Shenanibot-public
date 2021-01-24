const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

let wsServer = null;
const clients = {
    status: [],
    levels: []
};
const state = {
    prefix: '',
    levels: '[]',
    status: ''
};

const setStatus = (open) => {
    state.status = (JSON.stringify({
        status: open ? 'open' : 'closed',
        command: `${state.prefix}add`
    }));
};

module.exports = {
  start: config => {
    if (wsServer) {
      return;
    }

    const port = config.overlayPort;
    state.prefix = config.prefix;
    setStatus(true);

    const app = express();
    app.use(express.static(path.join(__dirname, 'pub')));

    const httpServer = http.createServer(app);
    wsServer = new WebSocket.Server({
      server: httpServer
    });
    wsServer.on('connection', (ws,req) => {
      console.log(`received ws request for ${req.url}`);
      if (req.url === '/levels') {
        clients.levels.push(ws);
        ws.on('close', () => {
          console.log('ws connection for /levels closed');
          clients.levels.splice(clients.levels.indexOf(ws), 1);
        });
        ws.send(state.levels);
      }
      if (req.url === '/status') {
        clients.status.push(ws);
        ws.on('close', () => {
          console.log('ws connection for /status closed');
          clients.status.splice(clients.status.indexOf(ws), 1);
        });
        ws.send(state.status);
      }
    });

    httpServer.listen(port, () => {
      console.log(`Go to http://localhost:${port}/ for overlay setup instructions`);
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
        type: e ? 'level' : 'mark',
        level: e || undefined
    })));
    for (const ws of clients.levels) {
        ws.send(state.levels);
    }
  }
};
