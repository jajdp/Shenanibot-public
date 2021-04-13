const _random = Math.random;

beforeAll(function() {
  this.setRandomizerToMax = () => {
    Math.random = () => .99999999999;
  }

  this.setRandomizerToMin = () => {
    Math.random = () => 0;
  }
});

afterEach(function() {
  Math.random = _random;
});
