const inquirer = require("inquirer");
const { Functions, InputFile } = require("node-appwrite");
const ProgressBar = require("progress");
const { faker } = require("@faker-js/faker");
const { execSync } = require("child_process");

const getEntrypoint = (runtime) => {
  const languge = runtime.split('-')[0];

  switch (languge) {
    case 'dart':
      return 'lib/main.dart';
    case 'deno':
      return 'src/main.ts';
    case 'node':
      return 'src/main.js';
    case 'bun':
      return 'src/main.ts';
    case 'php':
      return 'src/index.php';
    case 'python':
      return 'src/main.py';
    case 'ruby':
      return 'lib/main.rb';
    case 'rust':
      return 'main.rs';
    case 'swift':
      return 'Sources/index.swift';
    case 'cpp':
      return 'src/main.cc';
    case 'dotnet':
      return 'src/Index.cs';
    case 'java':
      return 'src/Main.java';
    case 'kotlin':
      return 'src/Main.kt';
  }

  return undefined;
};

const getInstallCommand = (runtime) => {
  const languge = runtime.split('-')[0];

  switch (languge) {
    case 'dart':
      return 'dart pub get';
    case 'deno':
      return "deno install";
    case 'node':
      return 'npm install';
    case 'bun':
      return 'bun install';
    case 'php':
      return 'composer install';
    case 'python':
      return 'pip install -r requirements.txt';
    case 'ruby':
      return 'bundle install';
    case 'rust':
      return 'cargo install';
    case 'dotnet':
      return 'dotnet restore';
    case 'swift':
    case 'java':
    case 'kotlin':
    case 'cpp':
      return '';
  }

  return undefined;
};

async function handleFunctions(appwrite) {
  const functions = await generateFunctions(appwrite);

  if (!functions.length) {
  }

  let deployments = await generateDeployments(appwrite, functions);
}

async function generateFunctions(appwrite) {
  const functionsClient = new Functions(appwrite);

  let functionsNo;
  if (global.auto) {
    functionsNo = 10;
  } else {
    functionsNo = (await inquirer.prompt([
      {
        type: "number",
        name: "functionsNo",
        message: "How many functions would you like to generate?",
        default: 10
      },
    ])).functionsNo;
  }

  let activeRuntimes = await functionsClient.listRuntimes();

  let languages;
  if (global.auto) {
    languages = activeRuntimes.runtimes.map((runtime) => { return runtime.$id });
  } else {
    languages = (await inquirer.prompt([
      {
        type: "checkbox",
        name: "languages",
        message: "Which languages would you like to generate?",
        choices: activeRuntimes.runtimes.map((runtime) => {
          return {
            name: runtime.name,
            value: runtime.$id,
            checked: true
          };
        }),
      },
    ])).languages;
  }

  const functions = [];
  const bar = new ProgressBar(
    "Creating new functions... [:bar] :current/:total",
    {
      total: functionsNo,
    }
  );

  for (let i = 0; i < functionsNo; i += 1) {
    const runtime = languages[Math.floor(Math.random() * languages.length)];

    await functionsClient
      .create(
        "unique()",
        `${faker.word.adjective()} ${faker.word.noun()}`,
        runtime
      )
      .then((response) => {
        functions.push(response);
        bar.tick();
        return response;
      });
  }

  return functions;
}

async function generateDeployments(appwrite, functions) {
  const functionsClient = new Functions(appwrite);

  let createDeployments;
  if (global.auto) {
    createDeployments = true;
  } else {
    createDeployments = (await inquirer.prompt([
      {
        type: "confirm",
        name: "createDeployments",
        message: "Would you like to create deployments for these functions?",
        default: true
      },
    ])).createDeployments;
  }


  if (!createDeployments) {
    return;
  }

  let deploymentsNo;
  if (global.auto) {
    deploymentsNo = 2;
  } else {
    deploymentsNo = (await inquirer.prompt([
      {
        type: "number",
        name: "deploymentsNo",
        message: "How many deployments would you like to generate per function?",
        default: 2,
      },
    ])).deploymentsNo;
  }

  console.log("Preparing function source codes ...");

  execSync("rm -rf /tmp/function-starter && mkdir -p /tmp/function-starter && git clone https://github.com/appwrite/functions-starter.git /tmp/function-starter && cd /tmp/function-starter && git checkout dev");

  const zippedRuntimes = [];

  for (let i = 0; i < functions.length; i++) {
    const runtime = functions[i].runtime;
    if (zippedRuntimes.includes(runtime)) {
      continue;
    }

    execSync(`rm -rf tmp/function-starter/${runtime}.tar.gz && cd /tmp/function-starter/${runtime} && tar -czf ../${runtime}.tar.gz .`);
    zippedRuntimes.push(runtime);
  }

  const bar = new ProgressBar(
    "Creating new deployments... [:bar] :current/:total",
    {
      total: functions.length * deploymentsNo,
    }
  );

  for (let i = 0; i < functions.length; i++) {
    for (let l = 0; l < deploymentsNo; l++) {
      const runtime = functions[i].runtime;

      const code = InputFile.fromPath(`/tmp/function-starter/${runtime}.tar.gz`, `${runtime}.tar.gz`);
      await functionsClient.createDeployment(functions[i].$id, code, true, getEntrypoint(runtime), getInstallCommand(runtime));
      bar.tick();
    }
  }
}

module.exports = {
  handleFunctions,
};
