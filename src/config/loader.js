const fs = require('fs');
const fp = require('lodash/fp');
const path = require("path");

const defaultConfig = require('./defaultConfig');
const dotenv = require('dotenv');

const configFilename = "config.json";

const loader = {
  load() {
    const jsonData = loadFromJson();
    const config = fp.merge(defaultConfig, jsonData || loadFromLegacy() || {});
    if (!jsonData) {
      try {
        this.save(config);
      } catch(e) {}
    }
    return config;
  },

  save(config) {
    fs.writeFileSync(configFilename, JSON.stringify(config, null, 4));
  },

  rewardHelper: {
    updateRewardConfig: behaviors => {
      try {
        const config = loader.load();
        config.twitch.rewardBehaviors = behaviors;
        loader.save(config);
        return('');
      } catch (e) {
        console.log('\nERROR: unable to write config.json:', e);
        console.log(`\nIf you need to manually update config.json, the value of the "rewardBehaviors"\nkey in the "twitch" section should be\n\n${JSON.stringify(behaviors, null, 4)}\n`);

        const ids = Object.keys(behaviors).filter(id => !!behaviors[id]);
        const msg = 'If you use a .env config file because you can\'t write a config.json,';
        if (ids.length) {
          console.log(`${msg} the\nfollowing should replace any existing TWITCH_POINTS_* entries in the file:\n`);
          for (const id of ids) {
            console.log(`TWITCH_POINTS_${behaviors[id].toUpperCase()}="${id}"`);
          }
        } else {
          console.log(`${msg} remove\nany existing TWITCH_POINTS_* entries from the file.`);
        }
        console.log('\n');
      }
      return 'There was an issue updating the configuration; please refer to the log for more information';
    }
  }
};
module.exports = loader;

function loadFromJson() {
  if (fs.existsSync(configFilename)) {
    try {
      const data = fs.readFileSync(configFilename);
      return convertToCurrentVersion(JSON.parse(data));
    } catch(e) {}
  }

  return null;
}

function convertToCurrentVersion(opts) {
  const version = opts.version || [0,0,0];

  if (version[0] > 1 || (version[0] === 1 && version[1] > 3)) {
    return opts;
  }

  const updatedOpts = {...opts};
  updatedOpts.version = [1,4,0];

  try {
    updatedOpts.config.httpPort = opts.config.overlayPort;
    delete updatedOpts.config.overlayPort;
  } finally {
    try {
      loader.save(updatedOpts);
    } catch(e) {}
  }
  return updatedOpts;
}

function loadFromLegacy() {
  const lc = v => process.env[v] ? process.env[v].toLowerCase() : undefined;

  try {
    dotenv.config();

    const params = {
      auth: {
        botUsername: lc('BOT_USERNAME'),
        oauthToken: process.env.OAUTH_TOKEN,
        channel: lc('CHANNEL'),
        streamer: lc('STREAMER'),
        delegationToken: process.env.DELEGATION_TOKEN
      },
      config: {
        prefix: process.env.PREFIX,
        levelLimit: process.env.LEVEL_LIMIT,
        levelLimitType: lc('LEVEL_LIMIT_TYPE'),
        priority: lc('PRIORITY'),
      }
    };
    if (process.env.USE_THROTTLE) {
      params.config.useThrottle = lc('USE_THROTTLE') === 'true';
    }
    if (lc('USE_OVERLAY') === 'true') {
      params.config.overlayPort = process.env.OVERLAY_PORT || 8080;
    }
    params.twitch = {
      rewardBehaviors: loadRewardConfigFromLegacy()
    };

    return params;
  } catch (e) {}

  return null;
}

function loadRewardConfigFromLegacy() {
  if (process.env.DATA_PATH) {
    try {
      const data = fs.readFileSync(
                       path.join(process.env.DATA_PATH, "twitchpoints.json"));
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
}
