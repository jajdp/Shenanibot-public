# Shenanibot
The Shenanibot is a free Twitch chatbot developed to help streamers manage a queue of viewer-chosen levels for the Butterscotch Shenanigans game [Levelhead](https://bscotch.net/games/levelhead)

## What does it do?
The bot stores a list of viewer-submitted levelcodes for you to play, and automatically syncs them to your bookmarks directly in LevelHead, so that you don't have to type in the level codes and keep track of them!

## Commands
**Streamer Commands**  
`!open` : Opens the queue for viewers to submit levels  
`!close` : Closes the queue  
`!permit [user name]` : Allows a user to add one level to the queue even if it is closed or they have reached the submission limit  
`!next` : Moves the queue forward a level  
`!random` : Chooses a random level from the queue and puts it at the front of the queue to play; if there are "high priority" levels available to be chosen (i.e. as a result of channel point reward redemptions), these will be chosen before any non-priority levels
`!mark` : Place a marker in the queue.  Markers do two things:  First, they occupy a spot in the queue to allow for situations with no "now playing" level.  For example, if you don't want the first submitted level to immediately move to "now playing", you can insert a marker before opening the queue.  Second, `!random` will only consider levels up to the next marker.  (That is, if the top of the queue is a marker, it will be discarded as normal; but then a level will be chosen from those that are before the subsequent marker in the queue.)  
 `!reward [reward behavior]` : Sets up a channel points reward.  Unlike other commands, this must be sent as the message for a custom channel points reward; it assigns a behavior to that particular custom reward.  See [Channel Points Integration](#channel-points-integration) for details.
 `!noreward [reward behavior]` : Removes the assignment of a reward behavior from whatever custom reward currently has that behavior
  
**Viewer Commands**  
`!add [level code]` : Adds a level to the level queue  
`!remove [level code]` : Removes a level from the queue, you can only remove your own levels  
`!queue` : Shows up to 10 of the next levels in the queue  
`!commands` or `!help` : Shows some quick commands for viewers  
`!bot` : Shows bot description  

## Want to add or edit commands?
Feel free to fork or clone the bot, and change it however you like. If you want your changes to be put in the main version, simply open a pull reqest and we will review it ASAP


# Bot Setup
**Have any questions?**
You can join the [Butterscotch Shenanigans Discord](https://discord.gg/w55QE5Y) and ask any questions you have!  

## Getting Started
**Materials:**  
+ Node.js
+ Streamer Twitch account
+ Bot Twitch account

If you don't know how to program, don't worry. This quick guide will teach everything you need to know to get the bot up and running!

**Node.js**  
In order to run the chatbot, you will need to download Node.js, which you can download at https://nodejs.org. Click on the button that says *'Recommended for most users'*. Once it has downloaded, open the file, and a window will pop up to help guide you through the installation. The default settings should work fine.

Next, you will have to download the code for the bot. Click on the green button at the top of this screen that says **Code**, then click on **Download ZIP**

Now you need to locate the file `.env` (It's in the root of the project, like where the `package.json` is). Once you have it, open it with your text editor of choice, then you will need to fill those fields with the following information:


# Parameters
## Authentication

### Delegation Key
You will need a delegation key from your own [Levelhead account](https://www.bscotch.net/account) with the following permissions:  
+ View own and others' Levelhead data (levels, profiles, aliases, etc).  
+ View, add, and delete own Levelhead level bookmarks.  
After you have generated it, copy it, and paste it in the `DELEGATION_TOKEN` parameter of the `.env` file. eg.  

`DELEGATION_TOKEN="blahblahblahblah"`

### Twitch Streamer Channel Name
On your own channel https://www.twitch.tv/channelName, get the last part that says "channelName" and paste it into the `CHANNEL` parameter eg.  

`CHANNEL="someLevelheadStreamer"`

### Twitch Streamer Channel Username
On your own channel, write something in the chat and copy your Twitch username displayed like this:

`TwitchDisplayUserName: hey what's up?`

`TwitchDisplayUserName` would be your display username, then paste it into the `STREAMER` parameter eg.  

`STREAMER="someTwitchUsername"`

### Twitch Bot Username and OAuth Token
This is the part where you need a second Twitch account, make sure that you don't do it on your streaming account!

You can get the OAuth token by going to https://twitchapps.com/tmi/, and accepting the permissions **on the bot account!**  
Copy the token that it gives you, and **do not share it with anybody!**
Once you have the information, just paste them into the `BOT_USERNAME` and `OAUTH_TOKEN` parameters eg.

`BOT_USERNAME="LevelheadBot"`
`OAUTH_TOKEN="123123123123131231231"`

## Configuration

### Prefix
This parameter lets you customize what the symbol that denotes a command. For example in `!add`, the `!` is the prefix to your command. Just choose what you want the prefix to be, and fill out the parameter `PREFIX` eg.

`PREFIX="$"`

### Level Submission Limit
This parameter controls how many levels a single person can submit. Set it to 0 to disable the limit. You can set it to any number you would like, in the `LEVEL_LIMIT` parameter eg.

`LEVEL_LIMIT=5`

### Level Submission Limit Type
This option controls how the `LEVEL_LIMIT` option works.  It can be set to `session` which means each user can only submit -**x**- levels until the bot is reset, or `active` which means each user can only have -**x**- levels in the queue at one time

`LEVEL_LIMIT_TYPE="active"`

### Twitch Message Throttling
If you want to limit the rate at which the bot sends twitch chat messages, you can enable this option.  This can be useful to prevent an active chat (or potentially an attacker) from causeing the bot to spam or, in extreme cases, to be disconnected by Twitch anti-spam measures.

`USE_THROTTLE="true"`

### Overlay
The bot can provide a web server to display information about the queue.  The pages served in this way can be used, for example, as browser sources in OBS.  By default the server will listen on port 8080, but this is configurable.

`USE_OVERLAY="true"`

`OVERLAY_PORT=8888`

For details on the available views and how to customize them, start up the bot and navigate a web browser to the URL it provides (http://localhost:8080 by default).

### Data Path
If you are running the bot locally, then you can specify a directory where data can be written.  The default of `.` will place the files in the directory where you've installed the bot (assuming you launch it from that directory).

If you are using a remote hosting service to run the bot, then you will most likely need to leave this setting undefined.  (If the service you use offers persistent storage, you would need to consult their docs for a path to use to access that storage.)  When this is undefined, features that would require local storage may not be available or may not work as well.  The documentation for such features will spell out the limitations.

`DATA_PATH=.`

### Channel Point Reward Settings
If `DATA_PATH` is not set, then the `!reward` command will respond with information for you to add to the `.env` file.  (If `DATA_PATH` is set, then the `!reward` command will automatically write the required information to a file in that location and the corresponding `.env` settings will be ignored.  This means that if you set `DATA_PATH` after configuring rewards in `.env`, they will have to be reconfigured after setting `DATA_PATH`; but it avoids potentially frustrating problems with old settings being restored when restarting ShenaniBot.)

---
## Results
The final file should now look something like this: (**Note:** It does **not** matter what order the parameters are in)

```
BOT_USERNAME="yourBotUsername"
OAUTH_TOKEN="oauth:exampleoauthtoken"
CHANNEL="yourTwitchChannel"
STREAMER="yourUsername"
DELEGATION_TOKEN="exampledelegationkey"
PREFIX="!"
LEVEL_LIMIT_TYPE="active"
LEVEL_LIMIT=0
```

## Installing Project Dependencies
Next, you'll need to open your computer's terminal, and navigate to the project directory (Example: `C:\My_User\Documents\Shenanibot-public`). Just look up how to do it, or you can ask on the Discord how to do it.  
You can open the terminal on Windows by pressing "Window Key + R", then typing in `cmd`  
Once you are in the directory/folder, you can install the project dependencies by typing:  

`npm install`

If you are curious about what you are installing, here's a list of the project dependencies:
+ RumpusCE Node Package, https://github.com/bscotch/rumpus-ce
+ TMI.js, https://github.com/tmijs/tmi.js
+ DotEnv, https://www.npmjs.com/package/dotenv
+ Axios, https://www.npmjs.com/package/axios

# Running the Bot
Each time you run the bot, you'll have to naviagate in the terminal to the root of the project (Example: `C:\My_User\Documents\Shenanibot-public`, or where the `package.json` is located) and type:  

`node .`

Then the terminal window will show the connection process to your Twitch channel and greets you with `"Bot Online!"`

## Channel Points Integration
If you are a Twitch affiliate or partner, you can configure the bot to listen for custom channel point reward redemptions using the `!reward` command.

If you have configured `DATA_PATH` such that the bot can store persistent data, then the bot will automatically remember the rewards you configure.  Otherwise, the `!reward` command will give you inforamtion to add to your `.env` file so that reward configuration can be reloaded whenever you restart the bot.  (This is necessary because each streamer's rewards will have their own `custom-reward-id` values, which the bot needs to know in order to respond to the correct reward redemptions.)

The first step is to define a custom channel points reward for your Twitch channel.  The bot doesn't really care how you set the reward up, except the setting for Require Viewer to Enter Text must be enabled.  (This is necessary in order for the bot to see reward redemptions, and also is how the user will specify a level to be affected by the reward.)

It is not recommended to set the reward to skip the Reward Requests Queue.  The bot will attempt to fulfill the redemption automatically when it is first submitted regardless of this setting, but if the request is invalid (e.g. bad level code) the bot will have no way to refund the points; so if you want the option to refund errant redemptions, they need to go into the queue where you can handle refunds manually.

Also be aware that you may want to disable these rewards when not playing Levelhead, when the bot is not active, or when they wouldn't be applicable.  (For example, perhaps you've defined a reward with the `expedite` behavior; if you're playing a group of levels in random order then during that time you might disable that reward.)

Once you've created the custom reward in Twitch, you can use the `!reward` command to associate a specific behavior to the reward.  Each behavior can be associated with a single reward, and each reward can only be associated with a single behavior; but by setting up multiple rewards you can offer any or all of the behaviors described below.

So for example you can give the command `!reward priority` to tell the bot you want to assocaite a custom reward with the `priority` behavior so that users can have their levels played sooner in exchange for channel points.  (Note that you give this command by redeeming a custom reward with the message `!reward priority`, and then once this is done, viewers can redeem the reward with a level code for a level that is in the queue.)

If `DATA_PATH` is not defined, the bot will output a line of code to be added to the `.env` file.  The reward will be associated with the behavior for the current session, but you'll need to update `.env` before the next time you restart the bot in order for the reward behavior to be remembered.

You can use `!noreward` to remove the association of a behavior from a reward.  Again if `DATA_PATH` is not configured then you'll have to update `.env` for the chnage to be remembered.

### Behaviors

`urgent` - Mark a level as "high priority" and move it to the front of the queue subject to the following rules:  The "now playing" level is not affected.  If there are other "high priority" levels at the front of the queue, the level is added after them.  The level must already be in the queue.

Note that a reward with this behavior will allow levels to skip ahead of markers; so levels can be placed ahead of planned breaks from the queue, or they can be added to the existing pool of levels for `!random` (and will be chosen before any non-priority levels in the pool).  This is a suitable behavior if you want to allow viewers to occasionally ask you to play a level right away because they need to leave soon; generally you would attach a high cost to rewards with this behavior.

`priority` - Mark a level as "high priority" and move it up in the queue subject to the following rules:  The "now playing" level is not affected.  The level can not move up past a marker.  The level cannot move up past another "high priority" level.  The level must already be in the queue.

Unlike `urgent`, `priority` will not move a level past a marker; so if you use markers to play "batches" of levels, this moves a level to the front of its batch rather than the front of the entire queue.

`expedite` - Move a level up one space in the queue, provided this would not affect a marker, a "high priority" level (unless the level being expedited is itself "high priority"), or the "now playing" level.  The level must already be in the queue.

This does not mark the expedited level as "high priority".  While this may be suitable as a lower-cost reward, it could potentially lead to a "tug of war" where two users each have a level in the queue and each repeatedly use this reward to move their level ahead of the other.

`unlimit` - Add the level to the queue even if the submission limit for the user would be exceeded by doing so.  All other requirements for the user to be allowed to submit the level must be met (i.e. the queue must be open unless `!permit` has been granted to the user; the level cannot already have been played or removed by the streamer).

`add` - Add the level to the queue assuming all requirements for the user to be allowed to submit the level are met.  If a reward is associated with this behavior, then the regular `!add` command is disabled and levels can only be submitted by spending channel points.

## Lastly...
Feel free to study JavaScript and understand the code behind the Shenanibot. Make sure to edit and modify it as much as you need or want. And if you change it, feel free to help us make the bot better by sharing your code with us. Cheers!

and shoutouts to the BS brothers for such a fantastic game!
