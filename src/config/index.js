const inquirer = require("inquirer")
const fp = require("lodash/fp");
const Rx = require("rxjs");
const configLoader = require("./loader");

let initialConfig = configLoader.load();
const answers = { config: fp.cloneDeep(initialConfig) };

function buildMenuQuestion(menuName, q) {
  const aPath = `menu.${menuName}`;
  return {
    name: aPath,
    type: 'list',
    default: a => fp.get(aPath, a) || 0,
    when: () => {
      console.log('');
      return true;
    },
    pageSize: 10,
    ...q,
    choices: a => q.choices(a).map(o => ({
      ...o,
      value: JSON.stringify(o.value)
    }))
  };
}

function buildMenuOptionName(basename, required) {
  return basename + (required ? ' [Input Required]' : '');
}

function buildConfigQuestion(aPath, q, longPrompt) {
  return {
    name: `config.${aPath}`,
    default: a => fp.get(`config.${aPath}`, a),
    ...q,
    when: longPrompt ? a => {
      if (!q.when || q.when(a)) {
        console.log(`\n${longPrompt}\n`);
        return true;
      }
      return false;
    } : q.when
  };
}

function validateTwitchUsername(username) {
  if (username.length < 4) {
    return "Minimum length is 4 characters";
  }
  if (username.length > 25) {
    return "Maximum length is 25 characters";
  }
  if (!username.match(/^\w*$/)) {
    return "Valid characters are letters, numbers, and _";
  }
  if (username[0] === "_") {
    return "First character cannot be _";
  }
  return true;
}

const questions = {
  mainMenu: buildMenuQuestion('main', {
    message: "Main Menu:",
    choices: a => {
      const dirty = !fp.isEqual(a.config, initialConfig);
      const twitchInfoRequired = !(a.config && a.config.auth && a.config.auth.channel && a.config.auth.streamer);
      const twitchAuthRequired = !(a.config && a.config.auth && a.config.auth.botUsername && a.config.auth.oauthToken);
      const rumpusAuthRequired = !(a.config && a.config.auth && a.config.auth.delegationToken);
      const configRequired = twitchInfoRequired || twitchAuthRequired || rumpusAuthRequired;

      return [{
        name: buildMenuOptionName('Twitch Streamer Info', twitchInfoRequired),
        value: {q: 'twitchInfo'}
      }, {
        name: buildMenuOptionName('Twitch Bot Authentication', twitchAuthRequired),
        value: {q: 'twitchAuth'}
      }, {
        name: buildMenuOptionName('Rumpus Authentication', rumpusAuthRequired),
        value: {q: 'rumpusAuth'}
      },
      new inquirer.Separator(), {
        name: 'Queue Management Options',
        value: {q: 'queueConfig'}
      }, {
        name: 'Chat Options',
        value: {q: 'chatConfig'}
      }, {
        name: 'Web Server Options',
        value: {q: 'webServerConfig'}
      },
      new inquirer.Separator(), {
        name: 'Save',
        value: {save: true},
        disabled: dirty ? false : 'no changes'
      }, {
        name: 'Exit',
        value: {
          exit: true,
          confirmExit: dirty ? 'Your unsaved changes will be discarded'
                     : configRequired ? 'Required information is missing'
                     : null
        }
      }];
    }
  }),

  twitchInfo: [
    buildConfigQuestion(
      'auth.channel', {
        message: "Twitch Channel Name:",
        validate: validateTwitchUsername,
        filter: i => i.toLowerCase()
      },
        'The bot needs to know your channel name so it can communicate with your\n'
      + 'chat. (This is the part of your twitch strema URL after the final /.).'
    ),
    buildConfigQuestion(
      'auth.streamer', {
        message: "Streamer Username:",
        validate: validateTwitchUsername,
        filter: i => i.toLowerCase(),
        default: a => a.config.auth.streamer || a.config.auth.channel
      },
        'To make sure that only you can run streamer commands, the bot needs to know\n'
      + 'your twitch username. Normally this should be the same as your channel name.\n'
      + '(Twitch allows you to change the case of your username, but these values are\n'
      + 'case-insensitive to the bot.)\n'
      + '\n'
      + 'If in doubt, send a message in chat and copy the username that appears\n'
      + 'before your message.'
    )
  ],

  twitchAuth: [
    buildConfigQuestion(
      'auth.botUsername', {
        message: "Twitch Bot Username:",
        validate: validateTwitchUsername,
        filter: i => i.toLowerCase()
      },
        'The bot needs a twitch account to log into so that it can send and receive\n'
      + 'chat messages. If you have not already, you should create a second account\n'
      + 'specifically for bot use.'
    ),
    buildConfigQuestion(
      'auth.oauthToken', {
        message: "Twitch Bot OAuth Token:",
        filter: a => (a.slice(0,6) === 'oauth:' ? '' : 'oauth:') + a
      },
        'An OAuth token works like a password for the bot account. You can create\n'
      + 'the OAuth token at https://twitchapps.com/tmi/'
    )
  ],

  rumpusAuth: [
    buildConfigQuestion(
      'auth.delegationToken', {
        message: "Rumpus Delegation Token:"
      },
        'The bot needs a delegation key to interact with LevelHead online services\n'
      + 'through the Rumpus API (e.g. to bookmark queued levels so you won\'t have\n'
      + 'to type in level codes).\n'
      + '\n'
      + 'You can go to https://www.bscotch.net/account to create a delegation key;\n'
      + 'the key must have the following permissions:\n'
      + '\n'
      + '- View own and others\' Levelhead data (levels, profiles, aliases, etc)\n'
      + '- View, add, and delete own Levelhead level bookmarks'
    )
  ],

  queueConfig: [
    buildConfigQuestion(
      'config.priority', {
        type: 'list',
        message: "Priority Mode:",
        choices: [{
          name: 'First In, First Out',
          value: 'fifo'
        }, {
          name: 'Player Rotation',
          value: 'rotation'
        }]
      },
        'The queue can operate in either of two priority modes: fifo or rotation.\n'
      + '\n'
      + '- In fifo (first in, first out) mode, levels enter the queue in the order\n'
      + '  received.\n'
      + '\n'
      + '- In rotation mode, levels are organized into "rounds", and a viewer\n'
      + '  generally gets one level per round. All levels from one round are played\n'
      + '  before any levels from a later round; so you can make sure all viewers get\n'
      + '  a turn without limiting how many levels a viewer can have in the queue.'
    ),
    buildConfigQuestion(
      'config.levelLimitType', {
        type: 'list',
        message: "Level Submission Limit Type:",
        choices: [{
          name: 'Limit number of levels in the queue per player',
          value: 'active'
        }, {
          name: 'Limit total number of submissions per player',
          value: 'session'
        }, {
          name: 'Do not limit number of levels',
          value: 'none'
        }]
      },
        'You can limit the number of levels each viewer is allowed to submit. This\n'
      + 'limit can apply to the number of levels they have in the queue at one time,\n'
      + 'or it can apply to their total nubmer of submissions until you reset the\n'
      + 'bot.'
    ),
    buildConfigQuestion(
      'config.levelLimit', {
        when: a => {
          if (a.config.config.levelLimitType === 'none') {
            a.config.config.levelLimit = 0;
            return false;
          }
          return true;
        },
        message: 'Level Submission Limit:',
        default: a => a.config.config.levelLimit || 1,
        // type: 'number' acts up when validation fails, so use this instead
        filter: i => typeof i === 'string' && i.match(/^\s*[1-9]\d*\s*$/) ? parseInt(i) : i,
        validate: i => (typeof i !== 'number') ? 'Please enter a number of levels' : true
      }
    ),
    buildConfigQuestion(
      'config.creatorCodeMode', {
        type: 'list',
        message: 'Creator Code Mode:',
        choices: a => [{
          name: 'Present a level selection UI',
          disabled: a.config.config.httpPort
                        ? false : 'Web Server must be enabled',
          value: 'webui'
        }, {
          name: 'Copy the creator code to the clipboard',
          value: 'clipboard'
        }, {
          name: 'Show the creator code in chat but take no further action',
          value: 'manual'
        }, {
          name: 'Do not allow creator codes to be submitted',
          value: 'reject'
        }]
      },
        'You can allow viewers to submit creator codes if they don\'t have a specific\n'
      + 'level they want to submit. The Creator Code Mode determines whether or not\n'
      + 'creator codes are accepted into the queue and, if so, how the bot behaves\n'
      + 'when a creator code reaches the top of the queue (since unlike level codes\n'
      + 'they cannot simply be bookmarked).'
    )
  ],

  chatConfig: [
    buildConfigQuestion(
      'config.prefix', {
        message: "Command Prefix:",
        validate: i => i.match(/\s/) ? 'The prefix cannot contain whitespace' : true
      },
        'A prefix is required on all bot commands - e.g. by default viewers type\n'
      + '"!add" to use the add command. This allows the bot to ignore any message\n'
      + 'that doesn\'t start with the prefix.\n'
      + '\n'
      + 'If possible, you are encouraged to use the default prefix of "!". (This will\n'
      + 'minimize confusion for viewers, who have to remember which prefix to use on\n'
      + 'which streams.)\n'
      + '\n'
      + 'However, you can change it to avoid conflicts with commands from other bots.\n'
      + 'Any string of non-whitespace characters will work, but typically a single\n'
      + 'punctuation character is used (such as $).'
    ),
    buildConfigQuestion(
      'config.useThrottle', {
        type: 'confirm',
        message: 'Enable message throttling?',
        askAnswered: true
      },
        'Message throttling limits the rate at which the bot sends chat messages.\n'
      + 'This helps prevent the bot from accidentally triggering Twitch\'s anti-spam\n'
      + 'protections.\n'
      + '\n'
      + 'The throttle settings used by the bot may delay messages, but will not drop\n'
      + 'them entirely. Use of throttling is recommended.'
    ),
  ],

  webServerConfig: [
    buildConfigQuestion(
      'useWebServer', {
        type: 'confirm',
        name: 'useWebServer', // this is not stored in the config file
        message: 'Enable web server?',
        default: a => fp.get('config.config.httpPort', a) ? true : false,
        askAnswered: true
      },
        'Enabling the web server allows you to serve overlays. Overlays allow you to\n'
      + 'display info about the queue on-screen in your stream (e.g. by loading them\n'
      + 'in OBS browser sources and applying custom CSS to adjust their appearance\n'
      + 'for your stream layout).\n'
      + 'The web server can also provide a UI for choosing a level when a viewer\n'
      + 'submits a creator code.'
    ),
    buildConfigQuestion(
      'config.httpPort', {
        when: a => {
          if (!a.useWebServer) {
            delete a.config.config.httpPort;
            if (a.config.config.creatorCodeMode === 'webui') {
              a.config.config.creatorCodeMode = 'manual';
              console.log( '\n\t!!! WARNING !!!\n'
                         + '\tCreator Code Mode was changed to \'Show the creator code in\n'
                         + '\tchat but take no further action\' because the UI is not\n'
                         + '\tsupported when the web server is disabled.');
            }
            return false;
          }
          return true;
        },
        message: 'Web Server Port:',
        default: a => fp.get('config.config.httpPort', a) || 8080,
        // type: 'number' acts up when validation fails, so use this instead
        filter: i => {
          if (typeof i === 'string' && i.match(/^\s*[1-9]\d*\s*$/)) {
            const n = parseInt(i);
            if (n < 65536) {
              return n;
            }
          }
          return i;
        },
        validate: i => (typeof i !== 'number') ? 'Please enter a valid port number (1 - 65535)' : true
      }, 'The web server requires an unused TCP port.'
    )
  ]
};

const prompts = new Rx.Subject();
inquirer.prompt(prompts, answers).ui.process.subscribe(
  result => {
    if (result.name.slice(0,5) === 'menu.') {
      const answer = JSON.parse(result.answer);
      if (answer.q) {
        const next = fp.get(answer.q, questions);
        for (const q of next) {
          prompts.next(q);
        }
      }
      if (answer.save) {
        configLoader.save(answers.config);
        initialConfig = fp.cloneDeep(answers.config);
        console.log('\n  Configuration saved');
      }
      if (answer.confirmExit) {
        prompts.next({
          name: 'confirmExit',
          type: 'confirm',
          message: `${answer.confirmExit}; are you sure?`,
          default: false,
          askAnswered: true
        });
      } else if (answer.exit) {
        prompts.complete();
      } else {
        prompts.next(questions.mainMenu);
      }
    }
    if (result.name === 'confirmExit') {
      if (result.answer) {
        prompts.complete();
      } else {
        prompts.next(questions.mainMenu);
      }
    }
  },
  error => {
    console.log(`ERROR: ${error}`);
  }
);

console.log('ShenaniBot Configuration');
prompts.next(questions.mainMenu);
