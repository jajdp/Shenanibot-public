const clipboardy = require("clipboardy");

const clipboard = {
  content: undefined
};

clipboardy.writeSync = msg => clipboard.content = msg;

beforeAll(function() {
  this.clipboard = clipboard;
});

beforeEach(function() {
  clipboard.content = undefined;
});
