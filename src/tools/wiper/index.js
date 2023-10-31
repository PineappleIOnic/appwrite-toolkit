const inquirer = require("inquirer");

const wipeAll = require("./types/wipeAll");
const wipeProject = require("./types/wipeProject");
const wipeResources = require("./types/wipeResources");

module.exports = {
  name: "Wipe Data",
  value: "wipe",
  variables: [],
  args: [],
};

module.exports.action = async function (options) {
  let { wipeMode } = await inquirer.prompt([
    {
      type: "list",
      name: "wipeMode",
      message: "Which mode do you want to use?",
      choices: [
        {
          name: "Wipe all data (Requires credentials)",
          value: "all",
        },
        {
          name: "Wipe Project",
          value: "project",
        },
        // {
        //   name: "Wipe resources",
        //   value: "resources",
        // },
      ],
    },
  ]);

  switch (wipeMode) {
    case "all":
      await wipeAll();
      break;
    case "project":
      await wipeProject();
      break;
    case "resources":
      await wipeResources();
      break;
  }
};
