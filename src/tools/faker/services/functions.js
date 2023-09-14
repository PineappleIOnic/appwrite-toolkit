const inquirer = require("inquirer");
const { Functions } = require("node-appwrite");
const ProgressBar = require("progress");
const { faker } = require("@faker-js/faker");
const { execSync } = require("child_process");

async function handleFunctions(appwrite) {
  const functions = await generateFunctions(appwrite);

  if (!functions.length) {
  }

  let deployments = await generateDeployments(appwrite, functions);
}

async function generateFunctions(appwrite) {
  const functionsClient = new Functions(appwrite);

  const { functionsNo } = await inquirer.prompt([
    {
      type: "number",
      name: "functionsNo",
      message: "How many functions would you like to generate?",
    },
  ]);

  let activeRuntimes = await functionsClient.listRuntimes();

  const { languages } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "languages",
      message: "Which languages would you like to generate?",
      choices: activeRuntimes.runtimes.map((runtime) => {
        return {
          name: runtime.name,
          value: runtime.$id,
        };
      }),
    },
  ]);

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

  const { createDeployments } = await inquirer.prompt([
    {
      type: "confirm",
      name: "createDeployments",
      message: "Would you like to create deployments for these functions?",
    },
  ]);

  if (!createDeployments) {
    return;
  }

  const { deploymentsNo } = await inquirer.prompt([
    {
      type: "number",
      name: "deploymentsNo",
      message: "How many deployments would you like to generate per function?",
      default: 1,
    },
  ]);

  const { useLFS } = await inquirer.prompt([
    {
      type: "confirm",
      name: "useLFS",
      message:
        "Would you like to artificially increase the size of the functions? (This will take longer to generate)",
    },
  ]);

  // Clone functions-starter repo into temp directory

  const bar = new ProgressBar(
    "Creating new deployments... [:bar] :current/:total",
    {
      total: functions.length * deploymentsNo,
    }
  );

  execSync(
    "git",
    ["clone", "https://github.com/appwrite/functions-starter.git"],
    {
      stdio: [0, 1, 2],
      cwd: "/tmp/function-starter",
      shell: true,
    }
  );

  executeCommand("mkdir /tmp/function-starter && git clone https://github.com/appwrite/functions-starter.git /tmp/function-starter", function (err, data) {
    if (err) {
      console.log(err);
    } else {
      console.log(data);
    }
  });
  
}

function executeCommand() {
  var exec = require("child_process").exec;

  var result = function (command, cb) {
    var child = exec(command, function (err, stdout, stderr) {
      if (err != null) {
        return cb(new Error(err), null);
      } else if (typeof stderr != "string") {
        return cb(new Error(stderr), null);
      } else {
        return cb(null, stdout);
      }
    });
  };

  exports.result = result;
}

module.exports = {
  handleFunctions,
};
