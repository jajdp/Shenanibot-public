const rewardHelper = require('./rewardHelper');

require('dotenv').config();
// this file basically just gets all the stuff from the .env file and makes it easier to access

const botUsername = process.env.BOT_USERNAME.toLowerCase();
const oauthToken = process.env.OAUTH_TOKEN;
const channel = process.env.CHANNEL.toLowerCase();
const streamer = process.env.STREAMER.toLowerCase();
const delegationToken = process.env.DELEGATION_TOKEN;

const prefix = process.env.PREFIX || '!';
const levelLimit = process.env.LEVEL_LIMIT || 0;
const levelLimitType = (process.env.LEVEL_LIMIT_TYPE || 'active').toLowerCase();
const priority = (process.env.PRIORITY || 'fifo').toLowerCase();
const useThrottle = (process.env.USE_THROTTLE || 'false').toLowerCase() === 'true';

const overlayPort = ((process.env.USE_OVERLAY || 'false').toLowerCase() === 'true') ? (process.env.OVERLAY_PORT || 8080) : null;

const dataPath = process.env.DATA_PATH;
const twitchRewards = rewardHelper.loadRewardConfig();

module.exports = {
  auth: {
    botUsername,
    oauthToken,
    channel,
    streamer,
    delegationToken
  },
  config: {
    prefix,
    levelLimit,
    levelLimitType,
    priority,
    useThrottle,
    overlayPort,
    dataPath
  },
  twitch: {
    rewardBehaviors: twitchRewards
  }
};
