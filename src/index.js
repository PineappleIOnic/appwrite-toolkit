#! /usr/bin/env node 

const inquirer = require("inquirer");
const figlet = require("figlet");
require("dotenv").config();

async function main() {
  const action = process.argv[2] ?? '';

  if(action === 'faker-auto') {
    global.auto = true;
    const faker = require("./tools/faker/index");
    await faker();
    return;
  }

  while (true) {
    console.log(
      "\n\n\n" +
        figlet.textSync("Appwrite Toolkit", {
          font: "Small",
          horizontalLayout: "default",
          verticalLayout: "default",
        })
    );

    const { selectedTool } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedTool",
        message: "Which tool do you want to use?",
        choices: [
          {
            name: "Generate Fake Data",
            value: "faker",
          },
          {
            name: "Bootstrap Appwrite Instance",
            value: "bootstrap",
          },
          {
            name: "Wipe Appwrite Data",
            value: "wiper"
          },
          {
            name: "Exit",
            value: "exit",
          },
        ],
      },
    ]);

    switch (selectedTool) {
      case "faker":
        const faker = require("./tools/faker/index");
        await faker();
        break;
      case "bootstrap":
        const bootstrap = require("./tools/bootstrap/index");
        await bootstrap();
        break;
      case "wiper":
        const wiper = require("./tools/wiper/index");
        await wiper();
        break;
      case "exit":
        process.exit(0);
      default:
        console.log("Invalid option");
        break;
    }

    const useAnotherTool = await inquirer.prompt([
      {
        type: "confirm",
        name: "useAnotherTool",
        message: "Do you want to use another tool?",
        default: false
      },
    ]);

    if (!useAnotherTool.useAnotherTool) {
      break;
    }
  }
}

main();
