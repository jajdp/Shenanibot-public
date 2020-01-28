const tmi = require('tmi.js');
const Axios = require('axios');
const fs = require('fs');

var path = process.cwd();
var buffer = fs.readFileSync(path + "./properties.json");
let jsonParsed = JSON.parse(buffer.toString());

const delegationKeyStreamer = jsonParsed.delegationKeyStreamer;
const twitchChannel = jsonParsed.twitchChannel;
const TwitchStreamer = jsonParsed.TwitchStreamer;


//--------------LOGIC FOR THE KSB-------------

const options = {
    options: {
        debug: true,
    },
    connection: {
        cluster: 'aws',
        reconnect: true,
    },
    identity: {
        username: jsonParsed.username,
        password: jsonParsed.password
    },
    channels: [twitchChannel],
};


//FROM THIS POINT ONWARDS, THERE IS NO NEED TO EDIT ANYTHING

//GLOBAL VARIABLES
var addQueueIndex = 0;
var currentQueueIndex = 0;
//Classes

// LEVEL CLASS
class courseLevelHead {

    constructor(levelCode) {
        this.levelCreatorCode = this.setLevelCode.bind(this);
        this.levelCode = levelCode;
        this.towerTrial = this.settowerTrial.bind(this);
        this.dailyBuild = this.setdailyBuild.bind(this);
        this.requiredPlayers = this.setrequiredPlayers.bind(this);
        this.creatorTime = this.setcreatorTime.bind(this);
        this.tags = this.settags.bind(this);
        this.createdAt = this.setcreatedAt.bind(this);
        this.updatedAt = this.setupdatedAt.bind(this);
        this.createdAgo = this.setcreatedAgo.bind(this);
        this.gameVersion = this.setgameVersion.bind(this);
        this.levelId = undefined;
        this.title = undefined;
        this.tower = undefined;
        this.stats = undefined;

    }

    async setLevelCode(lvlCreatorCode) {
        var levelCreatorCode = lvlCreatorCode;
        return (levelCreatorCode);
    }
    async settowerTrial(lvltowerTrial) {
        var towerTrial = lvltowerTrial;
        return (towerTrial);
    }
    async setdailyBuild(lvldailyBuild) {
        var dailyBuild = lvldailyBuild;
        return (dailyBuild);
    }
    async setrequiredPlayers(lvlrequiredPlayers) {
        var requiredPlayers = lvlrequiredPlayers;
        return (requiredPlayers);
    }
    async settags(lvltags) {
        var tags = lvltags;
        return (tags);
    }
    async setcreatedAt(lvlcreatedAt) {
        var createdAt = lvlcreatedAt;
        return (createdAt);
    }
    async setcreatorTime(lvlcreatorTime) {
        var creatorTime = lvlcreatorTime;
        return (creatorTime);
    }
    async setupdatedAt(lvlupdatedAt) {
        var updatedAt = lvlupdatedAt;
        return (updatedAt);
    }
    async setcreatedAgo(lvlcreatedAgo) {
        var createdAgo = lvlcreatedAgo;
        return (createdAgo);
    }
    async setgameVersion(lvlgameVersion) {
        var gameVersion = lvlgameVersion;
        return (gameVersion);
    }
}

class viewerLevel {
    constructor(courseLevelHead, submittedBy, state) {
        this.courseLevelHead = courseLevelHead;
        this.submittedBy = submittedBy;
        this.state = state;
    }

    async setcourseLevelHead(lvlcourseLevelHead) {
        var courseLevelHead = lvlcourseLevelHead;
        return (courseLevelHead);
    }
    async setsubmittedBy(lvlsetsubmittedBy) {
        var submittedBy = lvlsetsubmittedBy;
        return (submittedBy);
    }
    async setstate(lvlstate) {
        var state = lvlstate;
        return (state);
    }
}

let levelQueue = [];

async function addLevel2Queue(nivel) {
    levelQueue[addQueueIndex] = nivel;
    addQueueIndex = addQueueIndex + 1;
    return addQueueIndex;
}

async function wrapLevel(nivel, submittedby, state) {
    var level = await createLevel(nivel);
    var viewerTwitchLevel = new viewerLevel(level, submittedby, state);

    viewerTwitchLevel.courseLevelHead = level;
    viewerTwitchLevel.submittedBy = submittedby;
    viewerTwitchLevel.state = state;

    return viewerTwitchLevel;
}


async function createLevel(levelCode) {
    var levelResults = await rapi.getLevelById(levelCode)
    var submittedLevel = new courseLevelHead(levelCode)

    submittedLevel.levelCreatorCode = levelResults.userId;
    submittedLevel.levelId = levelResults.levelId;
    submittedLevel.title = levelResults.title;
    submittedLevel.tower = levelResults.tower;
    submittedLevel.towerTrial = levelResults.towerTrial;
    submittedLevel.dailyBuild = levelResults.dailyBuild;
    submittedLevel.requiredPlayers = levelResults.requiredPlayers;
    submittedLevel.creatorTime = levelResults.creatorTime;
    submittedLevel.tags = levelResults.tags;
    submittedLevel.createdAt = levelResults.createdAt;
    submittedLevel.updatedAt = levelResults.updatedAt;
    submittedLevel.createdAgo = levelResults.createdAgo;
    submittedLevel.gameVersion = levelResults.gameVersion;
    submittedLevel.stats = levelResults.stats;

    return submittedLevel;
}


// RUMPUSAPI CLASS
class RumpusAPI {

    constructor(delegationKey) {

        this.delegationKey = delegationKey;

        this.getClient = this.getClient.bind(this);
        this.getUrlParams = this.getUrlParams.bind(this);
        this.DelegationKeyOptions = this.DelegationKeyOptions.bind(this);
        this.DelegationKeyPermissions = this.DelegationKeyPermissions.bind(this);
        this.ReportAlias = this.ReportAlias.bind(this);
        this.getUserById = this.getUserById.bind(this);
        this.bulkGetUsersById = this.bulkGetUsersById.bind(this);
        this.SearchUsers = this.SearchUsers.bind(this);
        this.searchBookmarks = this.searchBookmarks.bind(this);
        this.purgeBookmarks = this.purgeBookmarks.bind(this);
        this.addBookmark = this.addBookmark.bind(this);
        this.removeBookmark = this.removeBookmark.bind(this);
        this.getLevelById = this.getLevelById.bind(this);
        this.bulkGetLevelsById = this.bulkGetLevelsById.bind(this);
        this.SearchLevels = this.SearchLevels.bind(this);
        this.getTags = this.getTags.bind(this);
        this.apiKey = undefined;
    }

    getClient() {
        return Axios.create({
            baseURL: 'https://www.bscotch.net/api/',
            timeout: 10000,
            headers: {
                'Rumpus-Delegation-Key': this.delegationKey,
            }
        });

    }


    getUrlParams(searchParams) {
        let params = '';
        for (let param in searchParams) {
            if (Array.isArray(searchParams[param])) {
                params += `${param}=${searchParams[param].join(',')}&`
            } else {
                params += `${param}=${searchParams[param]}&`
            }
        }

        if (params.length > 0) {
            params = params.slice(0, -1);
        }

        return params;
    }

    async DelegationKeyOptions() {
        const httpClient = await this.getClient();
        return (await httpClient.get(`delegation/options`)).data.data;
    }

    async DelegationKeyPermissions() {
        const httpClient = await this.getClient();
        return (await httpClient.get(`delegation/keys/@this`)).data.data;
    }

    /* Users */
    async ReportAlias(userId) {
        const httpClient = await this.getClient();
        return await httpClient.post(`levelhead/aliases/${userId}/reports`);
    }

    async getUserById(userId) {
        const httpClient = await this.getClient();
        return (await httpClient.get(`levelhead/aliases?userIds=${userId}`)).data.data[0]; //don't ask....
    }

    async bulkGetUsersById(users) {
        const httpClient = await this.getClient();

        let mappedUsers = [];
        while (users.length > 0) {
            let toGet = users.splice(0, Math.min(64, users.length));
            let userReuslt = (await httpClient.get(`levelhead/aliases?userIds=${toGet.join(',')}`)).data.data;
            mappedUsers = mappedUsers.concat(userReuslt);
        }

        return mappedUsers;
    }

    async SearchUsers(searchParams) {
        const httpClient = await this.getClient();
        const params = this.getUrlParams(searchParams);
        return (await httpClient.get(`levelhead/profiles?${params}`)).data.data;
    }

    /* Bookmarks */
    async searchBookmarks(searchParams, apiKey = null) {
        const httpClient = await this.getClient();
        httpClient.defaults.headers['Rumpus-Delegation-Key'] = apiKey || this.apiKey;
        const params = this.getUrlParams(searchParams)
        return (await httpClient.get(`levelhead/bookmarks?${params}`)).data.data;
    }

    async purgeBookmarks(apiKey = null) {
        const httpClient = await this.getClient();
        httpClient.defaults.headers['Rumpus-Delegation-Key'] = apiKey || this.apiKey;

        return (await httpClient.delete(`levelhead/bookmarks`));
    }

    async addBookmark(lookupCode, apiKey = null) {
        const httpClient = await this.getClient();
        httpClient.defaults.headers['Rumpus-Delegation-Key'] = apiKey || this.apiKey;

        return (await httpClient.put(`levelhead/bookmarks/${lookupCode}`));
    }

    async removeBookmark(lookupCode, apiKey = null) {
        const httpClient = await this.getClient();
        httpClient.defaults.headers['Rumpus-Delegation-Key'] = apiKey || this.apiKey;

        return (await httpClient.delete(`levelhead/bookmarks/${lookupCode}`));
    }

    /* Levels */
    async getLevelById(levelId) {
        const httpClient = await this.getClient();
        return (await httpClient.get(`levelhead/levels?levelIds=${levelId}&limit=1&includeStats=true&includeRecords=true`)).data.data[0]; //don't ask....
    }

    async bulkGetLevelsById(levelIds, includeStats = true, includeRecords = true) {

        const httpClient = await this.getClient();
        let newLevelData = [];
        while (levelIds.length > 0) {
            let toGet = levelIds.splice(0, Math.min(16, levelIds.length));
            let levelResults = (await httpClient.get(`levelhead/levels?levelIds=${toGet.join(',')}&limit=64&includeStats=${includeStats}&includeRecords=${includeRecords}`)).data.data;
            newLevelData = newLevelData.concat(levelResults);
        }

        return newLevelData;
    }

    async SearchLevels(searchParams) {
        const httpClient = await this.getClient();
        const params = this.getUrlParams(searchParams);
        return (await httpClient.get(`levelhead/levels?${params}`)).data.data;
    }

    async getTags() {
        const httpClient = await this.getClient();
        return await httpClient.get(`levelhead/level-tags/counts`).data;
    }

}


//FUNCTIONS

//Objects from Classes

let streamerQueue = [];
let rapi;
streamerQueue[1] = false;
const client = new tmi.client(options);


(async function main() {

    client.connect();

    client.on('connected', (address, port) => {
        client.action(twitchChannel, ': Adun Toridas!')
    });



    rapi = new RumpusAPI(delegationKeyStreamer);

    //await askParametters();

    client.on('chat', async (channel, user, message, self) => {
        //ADD BOOKMARK COMMAND
        if (message.match(/!add.*/)) {
            //MAPPING VARIABLES
            var twitchUser = user['display-name'];

            //FILTER 1 : QUEUE STATUS OPEN/CLOSE
            if (streamerQueue[1] === false) {
                client.action(twitchChannel, `: The queue is currently closed. But hey you can still make us company. We are missing a copilot in this adventure BloodTrail`);
                return;
            }

            var viewerMessage = message.split(' ');
            viewerMessage[0] = viewerMessage[0].trim();
            viewerMessage[1] = viewerMessage[1].trim();
            //FILTER 2 : INPUT IS THE CORRECT LENGTH
            if (viewerMessage.length != 2) {
                client.action(twitchChannel, `: Bruhh I've just been programmed don't try to take me down cmonBruh`);
                return;
            }
            //FILTER 3 : CODE IS 7 DIGITS LONG
            if (viewerMessage[1].length != 7) {
                client.action(twitchChannel, `: First of all... I'm not a rapper, but a level ID is normally 7 digits long, But I'm not a rapper RlyTho `);
                return;
            }

            //SEARCH LEVEL ON RAPI
            var searchLevelByIdResults = await rapi.SearchLevels({ levelIds: [viewerMessage[1]] });

            //FILTER 5 : LEVEL CODE EXISTS
            if (searchLevelByIdResults[0] === undefined) {
                client.action(twitchChannel, `: Level not found, make sure you put the right level ID DendiFace `);
                return;
            }
            await new Promise(res => setTimeout(res, 500));

            var viewerLevel = await wrapLevel(viewerMessage[1], twitchUser, false)

            await addLevel2Queue(viewerLevel);
            streamerQueue[0] = levelQueue;

            await rapi.addBookmark(viewerMessage[1], delegationKeyStreamer)


            client.action(twitchChannel, 'The level [ ' +
                streamerQueue[0][addQueueIndex - 1].courseLevelHead.title +
                ' ] with code [ '
                + streamerQueue[0][addQueueIndex - 1].courseLevelHead.levelCode +
                ' ] has been succesfully added to the queue. You can do !queue to see the queue '
            );

            await new Promise(res => setTimeout(res, 1000));
        }

        //QUEUE MANAGEMENT COMMANDS
        //Close queue command
        if (message === '!close' && user['display-name'] === TwitchStreamer) {
            streamerQueue[1] = false;
            client.action(twitchChannel, ': The queue has been closed');
            return;
        }
        //Open queue command
        if (message === '!open' && user['display-name'] === TwitchStreamer) {
            streamerQueue[1] = true;
            client.action(twitchChannel, ': The queue is now open');
            return;
        }
        //Clear Level command
        if (message === '!clear' && user['display-name'] === TwitchStreamer) {
            //FILTER 1 : QUEUE HAS AT LEAST 1 LEVEL
            if (addQueueIndex === 0) {
                client.action(twitchChannel, `: There aren't levels in the queue yet! Do you mind giving us one? Pretty please BibleThump`);
                return;
            }

            streamerQueue[0][currentQueueIndex].state = true;

            client.action(twitchChannel, 'GivePLZ Level cleared! TakeNRG ');
            //FILTER 2 : LAST LEVEL ON QUEUE
            console.log(streamerQueue[0][currentQueueIndex].state);
            if (currentQueueIndex === addQueueIndex - 1) {
                client.action(twitchChannel, `This was the last level. There are no more levels in the queue`);
                return;
            }

            currentQueueIndex = currentQueueIndex + 1;

            client.action(twitchChannel, twitchChannel + ' is now playing the level [ ' +
                streamerQueue[0][currentQueueIndex].courseLevelHead.title +
                ' ] with code [ '
                + streamerQueue[0][currentQueueIndex].courseLevelHead.levelCode +
                ' ] submitted by: ' +
                streamerQueue[0][currentQueueIndex].submittedBy);

        }
        //Skip Level command
        if (message === '!skip' && user['display-name'] === TwitchStreamer) {
            //FILTER 1 : QUEUE HAS AT LEAST 1 LEVEL
            if (addQueueIndex === 0) {
                client.action(twitchChannel, `: There aren't levels in the queue yet! Do you mind giving us one? Pretty please BibleThump`);
                return;
            }
            streamerQueue[0][currentQueueIndex].state = false;

            client.action(twitchChannel, ': The level [ ' + streamerQueue[0][currentQueueIndex].courseLevelHead.title + ' ] was skipped. ');
            client.action(twitchChannel, `: Mission Failed, We'll Get 'Em Next Time guys NotLikeThis`);
            //FILTER 2 : LAST LEVEL ON QUEUE

            if (addQueueIndex === ((streamerQueue[0].lenght) - 1)) {
                client.action(twitchChannel, `This was the last level. There are no more levels in the queue`);
                return;
            }

            currentQueueIndex = currentQueueIndex + 1;

            client.action(twitchChannel, twitchChannel + ' is now playing the level [ ' +
                streamerQueue[0][currentQueueIndex].courseLevelHead.title +
                ' ] with code [ '
                + streamerQueue[0][currentQueueIndex].courseLevelHead.levelCode +
                ' ] submitted by: ' +
                streamerQueue[0][currentQueueIndex].submittedBy);

        }
        //Next Level command
        if (message === '!next' && user['display-name'] === TwitchStreamer) {
            //FILTER 1 : QUEUE HAS AT LEAST 1 LEVEL
            if (addQueueIndex === 0) {
                client.action(twitchChannel, `: There aren't levels in the queue yet! Do you mind giving us one? Pretty please BibleThump`);
                return;
            }
            //FILTER 2 : LAST LEVEL ON QUEUE  
            if (currentQueueIndex === (streamerQueue[0].length - 1)) {
                client.action(twitchChannel, ': This is the last level on the queue!');
                return;
            }
            currentQueueIndex = currentQueueIndex + 1;

            client.action(twitchChannel, twitchChannel + ' is now playing the level [ ' +
                streamerQueue[0][currentQueueIndex].courseLevelHead.title +
                ' ] with code [ '
                + streamerQueue[0][currentQueueIndex].courseLevelHead.levelCode +
                ' ] submitted by: ' +
                streamerQueue[0][currentQueueIndex].submittedBy);
        }
        //Prev Level command
        if (message === '!prev' && user['display-name'] === TwitchStreamer) {
            //FILTER 1 : QUEUE HAS AT LEAST 1 LEVEL 
            if (addQueueIndex === 0) {
                client.action(twitchChannel, `: There aren't levels in the queue yet! Do you mind giving us one? Pretty please BibleThump`);
                return;
            }
            //FILTER 2 : LAST LEVEL ON QUEUE 
            if (currentQueueIndex === 0) {
                client.action(twitchChannel, ': This is the first level on the queue!');
                return;
            }
            currentQueueIndex = currentQueueIndex - 1;

            client.action(twitchChannel, twitchChannel + ' is now playing the level [ ' +
                streamerQueue[0][currentQueueIndex].courseLevelHead.title +
                ' ] with code [ ' +
                streamerQueue[0][currentQueueIndex].courseLevelHead.levelCode +
                ' ] submitted by: ' +
                streamerQueue[0][currentQueueIndex].submittedBy);

        }
        //SHOWS THE NEXT 5 LEVELS ON QUEUE
        if (message === '!q' || message === '!queue') {
            //FILTER 1 : QUEUE HAS AT LEAST 1 LEVEL 
            if (addQueueIndex === 0) {
                client.action(twitchChannel, `: The queue hasn't been initialized yet `);
                return;
            }

            var levelsRemainingCounter = 0;
            var remaininglevels = streamerQueue[0].length - (currentQueueIndex + 1);
            var queueLevelIndex = currentQueueIndex + 1;
            var queueLevels = [];
            var next5;
            //FILTER 2 : THERE ARE LEVELS STILL ON QUEUE
            if (remaininglevels === 0) {
                client.action(twitchChannel, `: The queue is empty `);
                return;
            }

            for (levelsRemainingCounter;
                levelsRemainingCounter < remaininglevels && levelsRemainingCounter <= 4;
                levelsRemainingCounter++) {
                queueLevels[levelsRemainingCounter] = [
                    ' [' +
                    streamerQueue[0][queueLevelIndex].courseLevelHead.title +
                    ' ', ' submitted by: ' +
                    streamerQueue[0][queueLevelIndex].submittedBy +
                    '] '
                ];
                console.log('queueLevelIndex : ' + queueLevels);
                queueLevelIndex = queueLevelIndex + 1;
            }

            if (remaininglevels > 5) {
                next5 = 5;
            } else {
                next5 = remaininglevels
            }

            client.action(twitchChannel, ': The next ' +
                next5 +
                ' levels are : ' +
                queueLevels +
                '. With a total of : ' +
                remaininglevels +
                ' levels in queue ');

        }


        if (message === '!totalq') {
            //FILTER 1 : QUEUE HAS AT LEAST 1 LEVEL 
            if (addQueueIndex === 0) {
                client.action(twitchChannel, `: The queue hasn't been initialized yet `);
                return;
            }

            var x = 0; //LEVELS BEATEN
            var y = 0; //LEVELS UNBEATEN

            for (var i = 0 && addQueueIndex != 0; i <= levelQueue.length - 1; i++) {
                if (streamerQueue[0][i].state != false) {
                    x = x + 1;
                } else {
                    y = y + 1;
                }
            }
            client.action(twitchChannel, ': There are ' + levelQueue.length + ' levels in total on queue. With ' + x + ' levels beaten and ' + y + ' levels unbeaten RalpherZ');
        }

        if (message === '!current') {
            if (addQueueIndex === 0) {
                client.action(twitchChannel, `: There aren't levels in the queue yet! Do you mind giving us one? Pretty please BibleThump`);
                return;
            }
            client.action(twitchChannel, twitchChannel + ' is playing the level [ ' +
                streamerQueue[0][currentQueueIndex].courseLevelHead.title +
                ' ] with code [ '
                + streamerQueue[0][currentQueueIndex].courseLevelHead.levelCode +
                ' ] submitted by: ' +
                streamerQueue[0][currentQueueIndex].submittedBy
            );
        }

        //MISCELANEOUS
        if (message === '!cmd') {
            client.action(twitchChannel, `: !add !bot !current !queue !totalq`);
            return;
        }

        if (message === '!bot') {
            client.action(twitchChannel, ': This twitch chat Bot was for the LevelHead Community. Please take good care of it. VoHiYo');
            return;
        }

    });
})();
