const inquirer = require("inquirer");
const fs = require("fs");

let cookieJar = {};

module.exports = async function () {
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

  const { useDefaults } = await inquirer.prompt([
    {
      type: "confirm",
      name: "useDefaults",
      message: "Do you want to use the default configuration?",
      default: true,
    },
  ]);

  let config = {
    endpoint: "http://localhost/v1",
    email: "admin@test.com",
    password: "password",
    username: "admin",
    teamId: "test",
    teamName: "Test Team",
    projectId: "test",
    projectName: "Test Project",
  }

  if (!useDefaults) {
    config = await createCustomConfig();
  }

  let response = await fetch(config.endpoint+"/account", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: "admin",
      email: config.email,
      password: config.password,
      name: config.username,
    }),
  });

  if (!response.ok) {
    console.log("Failed to create console account");
    console.error(await response.json());
    return;
  }

  // Login to Console
  response = await fetch(config.endpoint+"/account/sessions/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: config.email,
      password: config.password,
    }),
  });

  if (!response.ok) {
    console.log("Failed to login to console");
    console.error(await response.json());
    return;
  }

  cookieJar.console = parseCookies(response);

  // Create Team
  console.log(config.endpoint+"/v1/teams");
  response = await fetch(config.endpoint+"/teams", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: cookieJar.console,
    },
    body: JSON.stringify({
      teamId: config.teamId,
      name: config.teamName,
    }),
  });

  if (!response.ok) {
    console.log("Failed to create team");
    console.error(await response.json());
    return;
  }

  // Create Project
  response = await fetch(config.endpoint+"/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: cookieJar.console,
    },
    body: JSON.stringify({
      projectId: config.projectId,
      name: config.projectName,
      teamId: config.teamId,
      region: "default",
    }),
  });

  if (!response.ok) {
    console.log("Failed to create project");
    console.error(await response.json());
    return;
  }

  // Create API Key
  response = await fetch(config.endpoint+"/projects/test/keys", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: cookieJar.console,
    },
    body: JSON.stringify({
      name: "Project Key",
      scopes: [
        "users.read",
        "users.write",
        "teams.read",
        "teams.write",
        "databases.read",
        "databases.write",
        "collections.read",
        "collections.write",
        "attributes.read",
        "attributes.write",
        "indexes.read",
        "indexes.write",
        "documents.read",
        "documents.write",
        "files.read",
        "files.write",
        "buckets.read",
        "buckets.write",
        "functions.read",
        "functions.write",
        "execution.read",
        "execution.write",
        "locale.read",
        "avatars.read",
        "health.read",
        "migrations.read",
        "migrations.write",
      ],
    }),
  });

  if (!response.ok) {
    console.log("Failed to create API Key");
    console.error(await response.json());
    return;
  }

  let body = await response.json();

  console.log("Successfully bootstrapped Appwrite instance");
  console.table({
    Email: config.email,
    Password: config.password,
    "Project ID": config.projectId,
    "---------------": "---------------",
    Endpoint: config.endpoint,
    "API Key": body.secret,
  });

  const { shouldSaveConfig } = await inquirer.prompt([
    {
      type: "confirm",
      name: "shouldSaveConfig",
      message: "Do you want to save the credentials to .env?",
      default: true,
    },
  ]);

  if (shouldSaveConfig) {
    fs.writeFileSync(
      "./.env",
      `APPWRITE_ENDPOINT=${config.endpoint}\nAPPWRITE_API_KEY=${body.secret}\nAPPWRITE_PROJECT_ID=${config.projectId}`
    );

    global.appwriteEndpoint = config.endpoint;
    global.appwriteKey = body.secret;
    global.appwriteProjectID = config.projectId;
  }
};

function parseCookies(response) {
  return response.headers.get("Set-Cookie");
}

async function createCustomConfig() {
    let questions = [
        {
            type: "input",
            name: "endpoint",
            message: "What is your Appwrite endpoint?",
            default: process.env.APPWRITE_ENDPOINT ?? "http://localhost/v1",
        },
        {
            type: "input",
            name: "email",
            message: "What email do you want?",
            default: "admin@test.com"
        },
        {
            type: "input",
            name: "password",
            message: "What password do you want?",
            default: "password"
        },
        {
            type: "input",
            name: "username",
            message: "What username do you want?",
            default: "admin"
        },
        {
            type: "input",
            name: "teamId",
            message: "What TeamID do you want?",
            default: "test"
        },
        {
            type: "input",
            name: "teamName",
            message: "What Team Name do you want?",
            default: "Test Team"
        },
        {
            type: "input",
            name: "projectId",
            message: "What ProjectID do you want?",
            default: "test"
        },
        {
            type: "input",
            name: "projectName",
            message: "What is your project name?",
            default: "Test Project"
        }];

    return await inquirer.prompt(questions);
}
