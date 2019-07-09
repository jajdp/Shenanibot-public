const tmi = require('tmi.js');
const Axios = require('axios');
var delegationKLH = '';
let rapi;

//Setting bot parameters

const options = {
    options: {
        debug: true,
    },
    connection: {
        cluster: 'aws',
        reconnect: true,
    },
    identity: {
        username: '',
        password: '',
    },
    channels: [''],
};

const client = new tmi.client(options);

//CLASS RUMPUS API CONNECTION

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
    }

    getClient() {
        return Axios.create({
            baseURL: 'https://www.bscotch.net/api/',  
            timeout: 10000,
            headers: {
                'Rumpus-Delegation-Key' : this.delegationKey,
            }
        });
      
    }

    
    getUrlParams(searchParams) {
        let params= '';
        for(let param in searchParams) {
          if(Array.isArray(searchParams[param])) {
            params += `${param}=${searchParams[param].join(',')}&`
          } else {
            params += `${param}=${searchParams[param]}&`
          }
        }
        
        if(params.length > 0) {
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
      while(users.length > 0) {
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
    async searchBookmarks(searchParams, apiKey=null) {
        const httpClient = await this.getClient();
        httpClient.defaults.headers['Rumpus-Delegation-Key'] = apiKey || this.apiKey;
        const params = this.getUrlParams(searchParams)
        return (await httpClient.get(`levelhead/bookmarks?${params}`)).data.data;
    }

    async purgeBookmarks(apiKey=null) {
        const httpClient = await this.getClient();
        httpClient.defaults.headers['Rumpus-Delegation-Key'] = apiKey || this.apiKey;
        
        return (await httpClient.delete(`levelhead/bookmarks`));
    }

    async addBookmark(lookupCode, apiKey=null) {
        const httpClient = await this.getClient();
        httpClient.defaults.headers['Rumpus-Delegation-Key'] = apiKey || this.apiKey;
        
        return (await httpClient.put(`levelhead/bookmarks/${lookupCode}`));
    }

    async removeBookmark(lookupCode, apiKey=null) {
        const httpClient = await this.getClient();
        httpClient.defaults.headers['Rumpus-Delegation-Key'] = apiKey || this.apiKey;
        
        return (await httpClient.delete(`levelhead/bookmarks/${lookupCode}`));
    }

    /* Levels */
    async getLevelById(levelId) {
      const httpClient = await this.getClient();
      return (await httpClient.get(`levelhead/levels?levelIds=${levelId}&limit=1&includeStats=true&includeRecords=true`)).data.data[0]; //don't ask....
    }

    async bulkGetLevelsById(levelIds, includeStats=true, includeRecords=true) {
       
        const httpClient = await this.getClient();
        let newLevelData = [];
        while(levelIds.length > 0) {
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




// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

client.connect();
//SETTING THE DB CONEXION


//CHAT BOT LOGIC STARTS HERE

client.on('chat',async (channel,user,message,self) => {

    if(message.match(/!add.*/)) {

        
    }

})