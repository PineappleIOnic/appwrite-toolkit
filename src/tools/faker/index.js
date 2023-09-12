const inquirer = require("inquirer");
const { handleAuth } = require("./services/auth");
const { handleDatabases } = require("./services/databases");
const { handleStorage } = require("./services/storage");
const { handleFunctions } = require("./services/functions");
const { createAppwriteContext } = require("../../utils/getAppwrite");
require("dotenv").config();

module.exports = async function () {
  let appwrite = await createAppwriteContext();

  const { services } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "services",
      message: "Which services do you want to generate data for?",
      choices: [
        {
          name: "Auth",
          value: "auth",
        },
        {
          name: "Databases",
          value: "databases",
        },
        {
          name: "Storage",
          value: "storage",
        },
        {
          name: "Functions",
          value: "functions",
        },
      ],
    },
  ]);

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
};
