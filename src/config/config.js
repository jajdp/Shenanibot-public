require('dotenv').config();
// this file basically just gets all the stuff from the .env file and makes it easier to access

const botUsername = process.env.BOT_USERNAME.toLowerCase();
const oauthToken = process.env.OAUTH_TOKEN;
const channel = process.env.CHANNEL.toLowerCase();
const streamer = process.env.STREAMER.toLowerCase();
const delegationToken = process.env.DELEGATION_TOKEN;

const prefix = process.env.PREFIX || '!';
const levelLimit = process.env.LEVEL_LIMIT || 0;
const levelLimitType = (process.env.LEVEL_LIMIT_TYPE || 'active').toLocaleLowerCase();

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
    levelLimitType
  }
}
