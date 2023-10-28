const { Client } = require("node-appwrite");

async function createAppwriteContext(projectId, apiKey) {
  const appwrite = new Client();
  appwrite
    .setEndpoint(global.appwriteEndpoint)
    .setKey(apiKey)
    .setProject(projectId);
  return appwrite;
}

async function createAdminCookies() {
  if (global.authCookies) {
    return;
  }

  const email = 'toolkit@appwrite.io';
  const password = 'toolkitpass';

  console.log(`Email: ${email}`);
  console.log(`password: ${password}`);

  const register = async () => {
    await fetch(global.appwriteEndpoint + "/account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: "unique()",
        name: "Appwrite Toolkit",
        email: email,
        password: password,
      }),
    });
  };

  const login = async () => {
    let response = await fetch(global.appwriteEndpoint + "/account/sessions/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    if (!response.ok) {
      return false;
    }

    global.authCookies = response.headers.get("Set-Cookie");
    console.log("Setting");
    return true;
  }

  if (!(await login())) {
    await register();
    await login();
  }
}

module.exports = {
  createAppwriteContext,
  createAdminCookies,
};
