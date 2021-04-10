const WebSocket = require('ws');

const webSockets = [];

const waitForEvent = async (ws, type, count = 1) => new Promise(resolve => {
  const cb = () => {
    count -= 1;
    if (!count) {
      ws.off(type, cb);
      resolve();
    }
  };
  ws.on(type, cb);
});

beforeAll(function() {
  this.openWebSocket = async (urlPath, initialMessageCount = 1) => {
    const ws = new WebSocket(`ws://localhost:8080/${urlPath}`);
    const messages = [];

    const token = webSockets.length;
    webSockets.push({ ws, messages });

    ws.on('message', msg => {
      messages.push(JSON.parse(msg));
    });

    await waitForEvent(ws, 'open');
    if (initialMessageCount > messages.length) {
      await waitForEvent(ws, 'message', initialMessageCount - messages.length);
    }

    return token;
  };

  this.waitForNextWsMessage = async token => {
    return new Promise(resolve =>
      webSockets[token].ws.on('message', msg => resolve(JSON.parse(msg)), true)
    );
  };

  this.sendWsMessage = async (token, data) => {
    webSockets[token].ws.send(JSON.stringify(data));
  };

  this.closeWebSocket = async token => {
    const { ws, messages } = webSockets[token];
    webSockets[token] = null;

    ws.close();
    await waitForEvent(ws, 'close');

    return messages;
  };

  this.getQueue = async () => {
    const token = await this.openWebSocket('overlay/levels');
    const messages = await this.closeWebSocket(token);
    return messages[0];
  };

  this.getSimpleQueue = async () => {
    const queue = await this.getQueue();
    return queue.map(e => ({
      type: e.type,
      id: e.type === 'mark' ? undefined : e.entry.id
    }));
  };

  this.getCreatorInfo = async () => {
    const token = await this.openWebSocket('ui/creatorCode');
    const messages = await this.closeWebSocket(token);
    return messages[0];
  };
});

afterEach(async () => {
  webSockets.length = 0;
});
