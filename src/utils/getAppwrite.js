const inquirer = require("inquirer");
const fs = require("fs");
const { Client } = require("node-appwrite");

async function createAppwriteContext() {
    if (global.appwriteEndpoint && global.appwriteKey && global.appwriteProjectID) {
        let appwrite = new Client();
        appwrite
          .setEndpoint(global.appwriteEndpoint)
          .setKey(global.appwriteKey)
          .setProject(global.appwriteProjectID);
        return appwrite;
    }

    let { usePreviousConfig } = await inquirer.prompt([
        {
          type: "confirm",
          name: "usePreviousConfig",
          message: "Do you want to use your previous configuration?",
        },
      ]);
    
      let appwriteEndpoint = process.env.APPWRITE_ENDPOINT;
      let appwriteKey = process.env.APPWRITE_API_KEY;
      let appwriteProjectID = process.env.APPWRITE_PROJECT_ID;
    
      if (!usePreviousConfig) {
        let questions = [
          {
            type: "input",
            name: "appwriteEndpoint",
            message: "What is your Appwrite endpoint?",
            default: process.env.APPWRITE_ENDPOINT ?? "http://localhost/v1",
          },
          {
            type: "input",
            name: "appwriteKey",
            message: "What is your Appwrite API Key?",
          },
          {
            type: "input",
            name: "appwriteProjectID",
            message: "What is your Appwrite Project ID?",
          },
        ];
    
        if (process.env.APPWRITE_ENDPOINT) {
          questions[0].default = process.env.APPWRITE_ENDPOINT;
        }
    
        if (process.env.APPWRITE_API_KEY) {
          questions[1].default = process.env.APPWRITE_API_KEY;
        }
    
        if (process.env.APPWRITE_PROJECT_ID) {
          questions[2].default = process.env.APPWRITE_PROJECT_ID;
        }
    
        let { appwriteEndpoint, appwriteKey, appwriteProjectID } =
        await inquirer.prompt(questions);
    
        fs.writeFileSync(
          "./.env",
          `APPWRITE_ENDPOINT=${appwriteEndpoint}\nAPPWRITE_API_KEY=${appwriteKey}\nAPPWRITE_PROJECT_ID=${appwriteProjectID}`
        );
      }
    
      global.appwriteEndpoint = appwriteEndpoint;
      global.appwriteKey = appwriteKey;
      global.appwriteProjectID = appwriteProjectID;
    
      const appwrite = new Client();
      appwrite
        .setEndpoint(appwriteEndpoint)
        .setKey(appwriteKey)
        .setProject(appwriteProjectID);
}

module.exports = {
    createAppwriteContext
}