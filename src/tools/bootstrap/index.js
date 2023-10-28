const inquirer = require("inquirer");
const fs = require("fs");
const { createAdminCookies } = require("../../utils/getAppwrite");
const ProgressBar = require("progress");

module.exports = {
  name: "Bootstrap Appwrite",
  value: "bootstrap",
  requiredOptions: [
    [ "--amount <amount>", "amount of projects to bootstrap" ]
  ]
};

module.exports.action = async function (options) {
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

  await createAdminCookies();

  // Create Team
  response = await fetch(global.appwriteEndpoint + "/teams", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: global.authCookies,
    },
    body: JSON.stringify({
      teamId: 'toolkit-projects',
      name: 'Toolkit Projects',
    }),
  });

  if (!response.ok && response.status !== 409) {
    console.log("Failed to create team");
    console.error(await response.json());
    return;
  }

  // Create Project
  let progressbar = new ProgressBar(
    "Creating projects [:bar] :current/:total :percent :etas",
    { total: parseInt(options.amount) ?? 1 }
  );

  let projects = [];
  for (let i = 0; i < options.amount; i++) {
    progressbar.tick();
    let project = await createProject(
      global.appwriteEndpoint,
      "unique()",
      "Toolkit Project " + i,
      'toolkit-projects'
    );

    projects.push(project);
  }

  // Create API Key for each project
  for (i = 0; i < projects.length; i++) {
    let project = projects[i];

    let response = await fetch(
      global.appwriteEndpoint + "/projects/" + project.$id + "/keys",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: global.authCookies,
        },
        body: JSON.stringify({
          name: "Toolkit Key",
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
            "rules.read",
            "rules.write"
          ],
        }),
      }
    );

    if (!response.ok) {
      console.log("Failed to create API Key");
      console.error(await response.json());
      return;
    }

    let body = await response.json();

    projects[i].apiKey = body.secret;
  }

  console.log("Successfully bootstrapped Appwrite projects");

  fs.writeFileSync("./projects.json", JSON.stringify(projects.map((project) => {
    return {
      $id: project.$id,
      apiKey: project.apiKey
    }
  }), null, 2));
};

async function createProject(
  endpoint,
  projectId,
  projectName,
  teamId
) {
  response = await fetch(endpoint + "/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: global.authCookies,
    },
    body: JSON.stringify({
      projectId: projectId,
      name: projectName,
      teamId: teamId,
      region: "default",
    }),
  });

  if (!response.ok) {
    console.log("Failed to create project");
    console.error(await response.json());
    return;
  }

  let project = await response.json();
  return project;
}
