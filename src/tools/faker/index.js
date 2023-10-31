const fs = require("fs");
const inquirer = require("inquirer");
const { handleAuth } = require("./services/auth");
const { handleDatabases } = require("./services/databases");
const { handleStorage } = require("./services/storage");
const { handleFunctions } = require("./services/functions");
const { createAppwriteContext } = require("../../utils/getAppwrite");
require("dotenv").config();

module.exports = {
  name: "Generate Fake Data",
  value: "faker"
};

module.exports.action = async function (options) {
  let projects;
  try {
    projects = JSON.parse(fs.readFileSync('./projects.json').toString());
  } catch(err) {
    console.error(err);
    console.log("Check if you have projects.json. If not, run bootstrap first.");
    process.exit();
  }

  let services = ["auth", "databases", "storage", "functions"];
  if (!global.auto) {
    services = (
      await inquirer.prompt([
        {
          type: "checkbox",
          name: "services",
          message: "Which services do you want to generate data for?",
          choices: [
            {
              name: "Auth",
              value: "auth",
              checked: true,
            },
            {
              name: "Databases",
              value: "databases",
              checked: true,
            },
            {
              name: "Storage",
              value: "storage",
              checked: true,
            },
            {
              name: "Functions",
              value: "functions",
              checked: true,
            },
          ],
        },
      ])
    ).services;
  }

  let i = 0;
  for (const project of projects) {
    i++;
    console.log("Faking project '" + project.$id + "' " + i + " / " + projects.length);
    let appwrite = await createAppwriteContext(project.$id, project.apiKey);

    // Auth
    if (services.includes("auth")) {
      await handleAuth(appwrite);
    }

    // Databases
    if (services.includes("databases")) {
      await handleDatabases(appwrite);
    }

    // Storage
    if (services.includes("storage")) {
      await handleStorage(appwrite);
    }

    // Functions
    if (services.includes("functions")) {
      await handleFunctions(appwrite);
    }
  }
};
