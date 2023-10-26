const inquirer = require("inquirer");
const fs = require("fs");
const { Client } = require("node-appwrite");

async function createAppwriteContext() {
  if (
    global.appwriteEndpoint &&
    global.appwriteKey &&
    global.appwriteProjectID
  ) {
    let appwrite = new Client();
    appwrite
      .setEndpoint(global.appwriteEndpoint)
      .setKey(global.appwriteKey)
      .setProject(global.appwriteProjectID);
    return appwrite;
  }

  let usePreviousConfig;
  if (global.auto) {
    usePreviousConfig = true;
  } else {
    usePreviousConfig = (await inquirer.prompt([
      {
        type: "confirm",
        name: "usePreviousConfig",
        message: "Do you want to use your previous configuration?",
        default: true
      },
    ])).usePreviousConfig;
  }

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

  return appwrite;
}

async function login(endpoint, email, password) {
  if (!endpoint && global.appwriteEndpoint) {
    endpoint = global.appwriteEndpoint;
  }

  while (true) {
    if (!email && !password) {
      let results = await inquirer.prompt([
        {
          type: "input",
          name: "email",
          message: "What is your email?",
          default: "admin@test.com",
        },
        {
          type: "input",
          name: "password",
          message: "What is your password?",
          default: "password",
        },
      ]);

      email = results.email;
      password = results.password;
    }

    let response = await fetch(endpoint + "/account/sessions/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    if (!response.ok && response.status !== 403) {
      console.error("Credentials are incorrect, please try again");
      email = null;
      password = null;
    }

    if (!response.ok && response.status !== 409) {
      console.error("Failed to login to console");
      console.error(await response.json());
      return;
    }

    global.appwriteEndpoint = endpoint;
    global.authCookies = response.headers.get("Set-Cookie");
    return response.headers.get("Set-Cookie");
  }
}

async function createAdminCookies(endpoint, email, password) {
  if (global.authCookies) {
    return global.authCookies;
  }

  if (!endpoint && global.appwriteEndpoint) {
    endpoint = global.appwriteEndpoint;
  }

  if (!endpoint) {
    let results = await inquirer.prompt([
      {
        type: "input",
        name: "endpoint",
        message: "What is your Appwrite endpoint?",
        default: process.env.APPWRITE_ENDPOINT ?? "http://localhost/v1",
      },
    ]);

    endpoint = results.endpoint;
  }

  const { shouldLogin } = await inquirer.prompt([
    {
      type: "list",
      name: "shouldLogin",
      message: "How do you want to authenticate?",
      choices: [
        {
          name: "Sign in with email and password",
          value: true,
        },
        {
          name: "Register a new user",
          value: false,
        },
      ],
    },
  ]);

  if (shouldLogin) {
    return await login(endpoint, email, password);
  }

  if (!email && !password) {
    let results = await inquirer.prompt([
      {
        type: "input",
        name: "email",
        message: "What email do you want?",
        default: "admin@test.com",
      },
      {
        type: "password",
        name: "password",
        message: "What password do you want?",
        default: "password",
      },
    ]);

    email = results.email;
    password = results.password;
  }

  let creationResponse = await fetch(endpoint + "/account", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: "admin",
      email: email,
      password: password,
      name: "Admin",
    }),
  });

  if (!creationResponse.ok && creationResponse.status !== 409) {
    console.log("Failed to create console account");
    console.error(await creationResponse.json());
    return;
  }

  let response = await fetch(endpoint + "/account/sessions/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email,
      password: password,
    }),
  });

  if (!response.ok && response.status !== 409) {
    console.log("Failed to login to console");
    console.error(await response.json());
    return;
  }

  global.appwriteEndpoint = endpoint;
  global.authCookies = response.headers.get("Set-Cookie");
  return response.headers.get("Set-Cookie");
}

module.exports = {
  createAppwriteContext,
  createAdminCookies,
};
