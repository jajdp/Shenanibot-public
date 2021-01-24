const fs = require("fs");
const path = require("path");

const getRewardDataFilename = () => path.join(process.env.DATA_PATH, "twitchpoints.json")

module.exports = {
  configKeyFor: rewardName => `TWITCH_POINTS_${rewardName.toUpperCase()}`,

  loadRewardConfig: () => {
    if (process.env.DATA_PATH) {
      try {
        const data = fs.readFileSync(getRewardDataFilename());
        return JSON.parse(data);
      } catch (_) {
	return {};
      }
    } else {
      const rewardBehaviors = {};

      for (const key of Object.keys(process.env)) {
        if (key.startsWith("TWITCH_POINTS_")) {
          rewardBehaviors[process.env[key]] = key.substr(14).toLowerCase();
        }
      }
      return rewardBehaviors;
    }
  },

  updateRewardConfigFile: cfg => {
    fs.writeFileSync(getRewardDataFilename(), JSON.stringify(cfg));
  }
};
