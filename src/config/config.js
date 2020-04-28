require('dotenv').config();
// this file basically just gets all the stuff from the .env file and makes it easier to access

const botUsername = process.env.BOT_USERNAME;
const oauthToken = process.env.OAUTH_TOKEN;
const channel = process.env.CHANNEL;
const delegationToken = process.env.DELEGATION_TOKEN;

const prefix = process.env.PREFIX || '!';

module.exports = {
  auth: {
    botUsername,
    oauthToken,
    channel,
    delegationToken
  },
  config: {
    prefix
  }
}