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
`!random` : Chooses a random level from the queue and puts it at the front of the queue to play.  If there are markers in the queue, a level will be chosen from before the first marker.  If priority rules other than order have been applied to the queue, this command respects them; so the chosen level will always be one of thoes with the highest priority  
`!play` : Move the queue forward, pulling a specified level (by username or queue position) to the front to be played next. You can say, for example, `!play from username` to play the next level submitted by `username`; or `!play last from username` to play the level most recently submitted by `username`; or `!play 5` to play whatever level is at position #5 in the queue. Note that this will override any other priority rule, so it should be used with caution if, for example, channel points have been spent on priority  
`!mark` : Place a marker in the queue.  See [Using Markers](#using-markers) for details  
`!giveboost [user name]` : Allows a user to use the `!boost` command one time  
`!reward [reward behavior]` : Sets up a channel points reward.  Unlike other commands, this must be sent as the message for a custom channel points reward; it assigns a behavior to that particular custom reward.  See [Channel Points Integration](#channel-points-integration) for details  
`!noreward [reward behavior]` : Removes the assignment of a reward behavior from whatever custom reward currently has that behavior  
  
**Viewer Commands**  
`!check [level code]` : Checks if the streamer has played a level; note that very recent plays may not be reported  
`!add [level code]` : Adds a level to the level queue  
`!remove [level code]` : Removes a level from the queue, you can only remove your own levels  
`!boost [level code]` : Marks a level as "high priority" and moves it to the front of the qeuue, as though the `urgent` channel point reward had been applied. This command can be used by the streamer, or with permission from the streamer (see the `giveboost` command)  
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
+ LevelHead account
+ Streamer Twitch account
+ Bot Twitch account

If you don't know how to program, don't worry. This quick guide will teach everything you need to know to get the bot up and running!

**Node.js**  
In order to run the chatbot, you will need Node.js, which you can download at https://nodejs.org. Click on the button that says *'Recommended for most users'*. Once it has downloaded, open the file, and a window will pop up to help guide you through the installation. The default settings should work fine.

## Installing the Bot
Next, you will have to download the code for the bot. Click on the green button at the top of this screen that says **Code**, then click on **Download ZIP**

For new installations, pick a directory for the bot (e.g. "c:\my_user\Documents\Shenanibot-public); this will be referred to as the "bot directory" throughout these instructions. Unpack the contents of the ZIP file into the bot directory. 

If you're upgrading from a previous version, you can either user your existing bot diretory, or copy your configuration files to a new bot directory.

- To use your existing directory, you should remove the contents of the `src` folder.  (You might want to rename the old folder to `src-old` to keep as a backup until you have the new version working.)

- To use a new directory, you'll want to copy the `.env` file, and the `twitchpoints.json` file if there is one. These files will be used to initialize the new version's configuration. (These files are only used during upgrades to preserve the configuration from the old version; they are not needed for new installations.)

## Installing Project Dependencies
Next, you'll need to open your computer's terminal, and navigate to the bot directory. (You can open the terminal on Windows by pressing "Window Key + R", then typing in `cmd`; or you can run PowerShell as your terminal.)

Once you are in the directory/folder, you can install the project dependencies by typing:  

`npm install`

This will install several packages the bot uses (such as client libraries for Twitch chat and the Rumpus API), as well as any packages required by those packages.

## Configuration
For most configuration options, you can run the configuration utility by typing:

`npm run conigure`

For new installatios, you will need to provide some information that's needed for the bot to interact with Twitch and with LevelHead. (If you are upgrading from a previous version of ShenaniBot, your configuration should be imported automatically.)

You can also use the configuration utility to change configuration parameters at any time (although a bot restart is required for changes to take effect).

The configuration utility presents a menu with the following options:

### Twitch Streamer Info (required)
Here you set yoru Twitch channel name and username. Normally these will be the same (or will differ only by capitalization, which makes no difference to the bot). The bot connects to the chat for the specified channel and grants streamer access (such as the ability to execute streamer commands) for messages that match the username.

### Twitch Bot Authentication (required)
The bot needs an account to use when logging into Twitch chat. This account can be shared with other bots, but it should not be your streamer account.

Rather than a password, bots use an OAuth token to log in; so you need to provide a username and OAuth token for the bot account. Once you've created the bot account, you can generate an OAuth token for it at https://twitchapps.com/tmi

### Rumpus Authentication (required)
The Rumpus API allows the bot to communicate with LevelHead. (Most importantly, this is how bookmarks are updated.) The API uses a "delegation key" to provide access to various game functions. You can manage your delegation tokens at https://www.bscotch.net/account

The bot needs a token with the following permissions:
- View own and others' Levelhead data
- View, and, and delete own Levelhead level bookmarks

### Queue Management Options
Here you can decide whether levels are taken into the queue in the order received, or whether viewers "take turns" in a rotation; configure limits on how many levels each viewer may submit; and determine how to handle creator codes.

### Chat Options
Options that control the bot's interaction with chat are found here. You can change the prefix used to recognize bot cmmands. (By default this is !, and it is recommended to use this if possible.) You can also enable or disable message throttling.

### Overlay Options
You can enable or diable the overlay server, which allows you to include information about the queue in your stream layout (provided your streaming software can be set up to display a web view, such as with OBS Browser Sources).

Once you've configured this feature, the bot will provide a URL with setup instructions at start-up. (Most of the overlay setup is done in your streaming software.)


# Running the Bot
Each time you run the bot, you'll have to naviagate in the terminal to the bot directory and type:

`npm run start`

Then the terminal window will show the connection process to your Twitch channel and greets you with `"Bot Online!"`

## Using Markers
Markers create "breaks" in the queue.  This can be used in a couple different ways.

Markers occupy a spot in the queue.  When a marker reaches the top of the queue, no level from the queue will be bookmarked and the queue will report that no level is currently being played.  This can be used to prevent the first submission from automatically moving to "now playing" - e.g. if you want to use `!random` to shuffle the levels.  It also allows for planned breaks from viewer levels - such as for workshop sessions, tower trials, non-LH segments, etc.

Additionally, `!random` will only consider levels up to the next marker.  (That is, if the top of the queue is a marker, it will be discarded as normal; but then a level will be chosen from those that are before the subsequent marker in the queue.)  

### Markers and Priority Mode

With the default (`fifo`) priority mode, the behavior of markers is fairly straightforward.  Other priority modes change the order in which levels are played, but the positions of markers are unaffected by this process.

For example, suppose you have `PRIORITY` set to `rotation`.  One viewer has `!add`ed levels A and B to the qeueue; level A is in the "current round", and level B is in the "next round".  If you then place a marker, this schedules a break to occur after you've played two levels.  If a new viewer then submits level C, it will be added to the "current round"; it will be played after level A but before level B.  The break is scheduled to occur after two levels and the marker doesn't move; so level C is played after level A, then the break occurs, then level B is played.

This is intended to make breaks that are scheduled using markers as predictaable as possible; the only time the number of levels to be played before a scheduled break would increase is if you've configured a channel points reward with the `urgent` behavior.

## Channel Points Integration
If you are a Twitch affiliate or partner, you can configure the bot to listen for custom channel point reward redemptions using the `!reward` command.

If your bot is able to write to its `config.json` file, then the bot will automatically remember the rewards you configure.  Otherwise, the `!reward` command will log instructions for updating your configuration files; you'll find the instructions in the terminal where the bot is running.

The first step is to define a custom channel points reward for your Twitch channel.  The bot doesn't really care how you set the reward up, except the setting for Require Viewer to Enter Text must be enabled.  (This is necessary in order for the bot to see reward redemptions, and also is how the user will specify a level to be affected by the reward.)

It is not recommended to set the reward to skip the Reward Requests Queue.  The bot will attempt to fulfill the redemption automatically when it is first submitted regardless of this setting, but if the request is invalid (e.g. bad level code) the bot will have no way to refund the points; so if you want the option to refund errant redemptions, they need to go into the queue where you can handle refunds manually.

Also be aware that you may want to disable these rewards when not playing Levelhead, when the bot is not active, or when they wouldn't be applicable.  (For example, perhaps you've defined a reward with the `expedite` behavior; if you're playing a group of levels in random order then during that time you might disable that reward.)

Once you've created the custom reward in Twitch, you can use the `!reward` command to associate a specific behavior to the reward.  Each behavior can be associated with a single reward, and each reward can only be associated with a single behavior; but by setting up multiple rewards you can offer any or all of the behaviors described below.

So for example you can give the command `!reward priority` to tell the bot you want to assocaite a custom reward with the `priority` behavior so that users can have their levels played sooner in exchange for channel points.  (Note that you give this command by redeeming a custom reward with the message `!reward priority`, and then once this is done, viewers can redeem the reward with a level code for a level that is in the queue.)

You can use `!noreward` to remove the association of a behavior from a reward.  Again if the bot cannot write to its `config.json` file then you'll have to update the configuration manually for the chnage to be remembered; instructions will be logged to the terminal.

### Behaviors

`urgent` - Mark a level as "high priority" and move it to the front of the queue subject to the following rules:  The "now playing" level is not affected.  If there are other "high priority" levels at the front of the queue, the level is added after them.  The level must already be in the queue.

If `PRIORITY` is set to "rotation", the level's round assignment may change to be consistent with its new location in the queue.  However, for purposes of deciding what round the viewer's next submission would be added to, the level is still considered to occupy their spot in the round to which it was originally assigned.

Note that a reward with this behavior will allow levels to skip ahead of markers; so levels can be placed ahead of planned breaks from the queue, or they can be added to the existing pool of levels for `!random` (and will be chosen before any non-priority levels in the pool).  This is a suitable behavior if you want to allow viewers to occasionally ask you to play a level right away because they need to leave soon; generally you would attach a high cost to rewards with this behavior.

`priority` - Mark a level as "high priority" and move it up in the queue subject to the following rules:  The "now playing" level is not affected.  The level can not move up past a marker.  The level cannot move up past another "high priority" level.  The level must already be in the queue.  If `PRIORITY` is set to "rotation", the level cannot move up into an earlier round.

Unlike `urgent`, `priority` will not move a level past a marker; so if you use markers to play "batches" of levels, this moves a level to the front of its batch rather than the front of the entire queue.  Similarly, in "rotation" mode, this moves a level to the front of its round.

`expedite` - Move a level up one space in the queue, provided this would not affect a marker, a "high priority" level (unless the level being expedited is itself "high priority"), or the "now playing" level.  The level must already be in the queue.  If `PRIORITY` is set to "rotation", this cannot move a level into an earlier round.

This does not mark the expedited level as "high priority".  While this may be suitable as a lower-cost reward, it could potentially lead to a "tug of war" where two users each have a level in the queue and each repeatedly use this reward to move their level ahead of the other.

`unlimit` - Add the level to the queue even if the submission limit for the user would be exceeded by doing so.  All other requirements for the user to be allowed to submit the level must be met (i.e. the queue must be open unless `!permit` has been granted to the user; the level cannot already have been played or removed by the streamer).

`add` - Add the level to the queue assuming all requirements for the user to be allowed to submit the level are met.  If a reward is associated with this behavior, then the regular `!add` command is disabled and levels can only be submitted by spending channel points.

## Lastly...
Feel free to study JavaScript and understand the code behind the Shenanibot. Make sure to edit and modify it as much as you need or want. And if you change it, feel free to help us make the bot better by sharing your code with us. Cheers!

and shoutouts to the BS brothers for such a fantastic game!
