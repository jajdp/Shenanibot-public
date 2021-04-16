const _random = Math.random;

let values = [];
let i = 0;
const fakeRandom = () => {
  if (values.length) {
    return values[i++ % values.length];
  }
  return _random();
};
beforeAll(function() {
  this.setRandomSequence = (...vals) => {
    values = vals;
    i = 0;
    Math.random = fakeRandom;
  }

  this.prependToRandomSequence = (...vals) => {
    this.setRandomSequence(...vals.concat(values));
  };

  this.setRandomizerToMax = () => {
    this.setRandomSequence(.99999999999);
  }

  this.setRandomizerToMin = () => {
    this.setRandomSequence(0);
  }
});

beforeEach(() => {
  values = [];
  i = 0;
});

afterEach(function() {
  Math.random = _random;
});
