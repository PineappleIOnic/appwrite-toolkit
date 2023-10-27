#! /usr/bin/env node

const inquirer = require("inquirer");
const figlet = require("figlet");
const { Command, Option, Argument } = require("commander");
require("dotenv").config();

const Faker = require("./tools/faker/index");
const Bootstrap = require("./tools/bootstrap/index");
const Wiper = require("./tools/Wiper/index");

const tools = [Faker, Bootstrap, Wiper];

async function main() {
  const program = new Command();

  await program
    .version("0.0.1", "-v, --version", "output the current version")
    .addHelpText(
      "before",
      figlet.textSync("Appwrite Toolkit", {
        font: "Small",
        horizontalLayout: "default",
        verticalLayout: "default",
      })
    )
    .helpOption("-h, --help", "display help")
    .option("-d, --debug", "output extra debugging")
    .addOption(new Option('-p, --projects <number>', 'amount of projects to create'))
    .description("A suite of tools to aid in the development of Appwrite.")
    .action(async (options) => {
      await wizard(options);
    });;

  tools.forEach((tool) => {
    program
      .command(tool.value)
      .description(tool.name)
      .action((...args) => {
        tool.action(...args);
      });
  });

  program.parse(process.argv);

  const options = program.opts();
  if (options.debug) console.log(options);
}

async function wizard(options) {
  console.log(figlet.textSync("Appwrite Toolkit", {
    font: "Small",
    horizontalLayout: "default",
    verticalLayout: "default",
  }) + '\n');

  if (options.projects && !Number.isInteger(parseInt(options.projects))) {
    console.log("Error: Projects must be an integer!");
    return;
  }

  if (options.projects > 1) {
    console.log(`Warning: Creating ${options.projects} projects!`);
  }

  while (true) {
    const { selectedTool } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedTool",
        message: "Which tool do you want to use?",
        choices: [
          ...tools,
          {
            name: "Exit",
            value: "exit",
          },
        ],
      },
    ]);

    // Find function from selectTool
    if (selectedTool === "exit") {
      break;
    } else {
      for (let i = 0; i < tools.length; i++) {
        tool = tools[i];
        if (tools[i].value === selectedTool) {
          await tools[i].action();
        }
      }
    }

    const useAnotherTool = await inquirer.prompt([
      {
        type: "confirm",
        name: "useAnotherTool",
        message: "Do you want to use another tool?",
        default: false,
      },
    ]);

    if (!useAnotherTool.useAnotherTool) {
      break;
    }
  }
}

main();
