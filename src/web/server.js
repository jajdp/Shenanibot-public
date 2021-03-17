const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

let wsServer = null;
let botConfig = null;
const endpoints = {};

module.exports = {
  start: config => {
    if (wsServer) {
      return;
    }
    botConfig = config;

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
      endpoints[req.url].onConnect(ws, req);
    });

    httpServer.listen(config.httpPort);
    console.log(`Web server listening on port ${config.httpPort}`);
  },

  getConfig: () => botConfig,

  register: (url, onConnect = (ws,req) => {}) => {
    endpoints[url] = {
      clients: [],
      onConnect
    };
  },

  broadcast: (url, message) => {
    for (const ws of endpoints[url].clients) {
      ws.send(message);
    }
  }
};
