const { rewardHelper } = require("../../src/config/loader");

let behaviors = {};

rewardHelper.updateRewardConfig = newBehaviors => {
  for (const key of Object.keys(behaviors)) {
    delete behaviors[key];
  }

  for (const key of Object.keys(newBehaviors)) {
    behaviors[key] = newBehaviors[key];
  }
}

beforeEach(function() {
  this.rewardBehaviors = behaviors = {};
});
