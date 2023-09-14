const { Users, Query } = require("node-appwrite");

module.exports = class Authentication {
  constructor(resources, appwrite) {
    this.resources = resources;
    this.appwrite = appwrite;
  }

    paginateCall(appwriteFunction, args) {
        return new Promise(async (resolve, reject) => {
            let lastDocument = null;
            let result = {};
          try {
            while (true) {
                let query = [Query.limit(1000), Query.cursorAfter(lastDocument), ...args ?? []];
                let response = await appwriteFunction(...args ?? [], query);
    
                if (!response.ok) {
                  reject(response);
                }
    
                parsedResponse = await response.json();
                // Figure out the key of the response
                result.total += parsedResponse.total;
                unset(parsedResponse.total);
    
                let key = Object.keys(result).find((key) => Array.isArray(result[key]));
                result[key] = [...result[key], ...parsedResponse[key]];
                
                if (!parsedResponse.length > parsedResponse[key].length) {
                  break;
                }
            }
          } catch (error) {
            reject(error);
          }
        });        
    }

  async execute() {
    this.resources.forEach(async (resource) => {
      switch (resource) {
        case "users":
          await this.deleteUsers();
          break;
        case "teams":
          await this.deleteTeams();
          break;
        case "auth":
            await this.deleteUsers();
            await this.deleteTeams();
            break;
      }
    });
  }

    async deleteUsers() {
        let users = this.paginateCall(await new Users(this.appwrite).list);

        console.log(users);
    }
}
