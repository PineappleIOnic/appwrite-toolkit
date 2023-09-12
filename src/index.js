const inquirer = require("inquirer");
const figlet = require("figlet");
require("dotenv").config();

async function main() {
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
      },
    ]);

    if (!useAnotherTool.useAnotherTool) {
      break;
    }
  }
}

main();
