# Shenanibot
The Shenanibot is a free twitch chat bot developed to help streamers manage a queue of viewer-chosen levels for the Butterscotch Shenanigans game [Levelhead](https://bscotch.net/games/levelhead)

## What does it do?
The bot stores a list of viewer-submitted levelcodes for you to play, and automatically syncs them to your bookmarks directly in LevelHead, so that you don't have to type them in and keep track of them!

## Commands
**Streamer Commands**  
`!prev` : Moves the queue back a level  
`!next` : Moves the queue forward a level  
`!current` : Shows information about the current level being played  
`!complete` : Mark a level as beaten and move to the next level  
`!skip` : Mark a level as skipped or not beaten and move to the next level in the queue  
  
**Viewer Commands**  
`!add [level code]` : Adds a level to the level queue  
`!q` or `!queue` : Shows up to 5 next levels in the queue  
`!totalq` : Shows the total number of levels in the queue as well as how many levels have been completed or skipped  
`!cmd` : Shows some quick commands for viewers  
`!about` : Shows customized message  
`!bot` : Shows bot description  

## Want to add or edit commands?
Feel free to fork or clone the bot, and change it however you like! Feel free to contribute to the bot, it's opensource after all!  


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

Next, you will have to download the code for the bot. Click on the green button at the top of this screen that says *'Clone or download'*, then click on *'Download as zip'*

Now you need to locate the file `.env` (It's in the root of the project, like where the `package.json` is). Once you have it, open it with your text editor of choice, then you will need to fill those fields with the following information:

## Parameters

### Delegation Key
You will need a delegation key from your own [Levelhead account](https://www.bscotch.net/account) with the following permissions:
    -View own and others' Levelhead data (levels, profiles, aliases, etc).
    -View, add, and delete own Levelhead level bookmarks.
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

### Prefix (optional, default: "!")
This parameter lets you customize what the symbol that denotes a command. For example in `!add`, the `!` is the prefix to your command. Just choose what you want the prefix to be, and fill out the parameter `PREFIX` eg.

`PREFIX="$"`

### Results
The final file should now look something like this: (**Note:** It does **not** matter what order the parameters are in)

```
BOT_USERNAME="LevelheadBot"
OAUTH_TOKEN="123123123123131231231"
CHANNEL="someLevelheadStreamer"
STREAMER="someTwitchUsername"
DELEGATION_KEY="blahblahblahblah"
PREFIX="!"
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
Each time you run the bot, you'll have to naviagate in the terminal to the root of the project (where the `package.json` is located) and type:  

`node .`

Then the terminal window will show the connection process to your Twitch channel and greets you with "Bot Online!"

## Lastly...
Feel free to study JavaScript and understand the code behind the Shenanibot. Make sure to edit and modify it as much as you need or want. And if you change it, feel free to help us make the bot better by sharing your code with us. Cheers!

and shoutouts to the BS brothers for such a fantastic game!
