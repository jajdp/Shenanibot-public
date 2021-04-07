const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

let wsServer = null;
let botConfig = null;
const endpoints = {};

module.exports = {
  start: config => {
    botConfig = config;

    if (wsServer) {
      return;
    }

    const app = express();
    app.use(express.static(path.join(__dirname, "pub")));

    const httpServer = http.createServer(app);
    wsServer = new WebSocket.Server({
      server: httpServer
    });
    wsServer.shouldHandle = function(req) {
      return Object.keys(endpoints).includes(req.url);
    };
    wsServer.on("connection", (ws,req) => {
      console.log(`received ws request for ${req.url}`);
      endpoints[req.url].clients.push(ws);
      ws.on("close", () => {
        console.log(`ws connection for ${req.url} closed`);
        endpoints[req.url].clients
                          .splice(endpoints[req.url].clients.indexOf(ws), 1);
      });
      ws.on("message", data => {
        endpoints[req.url].onMessage(data, ws);
      });
      endpoints[req.url].onConnect(ws, req);
    });

    httpServer.listen(config.httpPort);
    console.log(`Web server listening on port ${config.httpPort}`);
  },

  getConfig: () => botConfig,

  register: (url, onConnect = (ws,req) => {}, onMessage = (msg,ws) => {}) => {
    endpoints[url] = {
      clients: [],
      onConnect,
      onMessage
    };
  },

  broadcast: (url, message) => {
    for (const ws of endpoints[url].clients) {
      ws.send(message);
    }
  },

  // This can be used to prepare the server to be attached to a new bot
  // instance.  Currently this is only important during unit testing.  Note
  // for efficiency we don't clear the ws server; it shouldn't matter and
  // would cost a lot of time in test runs if we reset it each time.
  reset: async config => {
    botConfig = null;
    for (const url of Object.keys(endpoints)) {
      while (endpoints[url].clients.length) {
        endpoints[url].clients[0].close();
        await new Promise(r => endpoints[url].clients[0].on('close', r));
      }
      delete endpoints[url];
    }
  }
};
