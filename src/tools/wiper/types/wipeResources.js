const TreePrompt = require("inquirer-tree-prompt");
const inquirer = require("inquirer");
const { createAdminCookies } = require("../../../utils/getAppwrite");
const Authentication = require("./resources/authentication");
const { Client } = require("node-appwrite");
inquirer.registerPrompt("tree", TreePrompt);

/**
 * Wipe Resources
 *
 * @param {Array} resources
 */
async function wipeResources() {
  let { selectedResources } = await inquirer.prompt([
    {
      name: "selectedResources",
      message: "Select resources to delete \n Use right arrow to expand",
      type: "tree",
      tree: [
        {
          name: "Auth",
          value: "auth",
          children: [
            {
              name: "Users",
              value: "users",
            },
            {
              name: "Teams",
              value: "teams",
              children: [
                {
                  name: "Delete Only Memberships",
                  value: "deleteMemberships",
                },
              ],
            },
          ],
        },
        {
          name: "Database",
          value: "database",
          children: [
            {
              name: "Documents",
              value: "documents",
              children: [
                {
                  name: "Keep Attributes",
                  value: "keepAttributes",
                },
              ],
            },
            {
              name: "Collections",
              value: "collections",
            },
          ],
        },
        {
          name: "Storage",
          value: "storage",
          children: [
            {
              name: "Buckets",
              value: "buckets",
              children: [
                {
                  name: "Files",
                  value: "files",
                },
              ],
            },
          ],
        },
        {
          name: "Functions",
          value: "functions",
          children: [
            {
              name: "Deployments",
              value: "deployments",
              children: [
                {
                  name: "Keep latest deployment",
                  value: "keepLatestDeployment",
                  children: [
                    {
                      name: "Delete",
                      value: "delete",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      multiple: true,
    },
  ]);

  console.log(
    "Are you 100% sure? This will delete the following resources (skipping API Keys):"
  );
  if (!selectedResources.length) {
    console.log("No resources selected");
    return;
}
  console.log(selectedResources.map((resource) => "• " + resource).join("\n"));

  let { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: "Are you sure?",
    },
  ]);

  if (!confirm) {
    return;
  }

  // Create an API key for each project.
  const cookies = await createAdminCookies();

  // Fetch All Projects
  let response = await fetch(global.appwriteEndpoint + "/projects", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      cookie: cookies,
    },
  });

  if (!response.ok && response.status !== 409) {
    console.log("Failed to fetch projects");
    console.error(await response.json());
    return;
  }

  let projects = await response.json();

  if (!projects.projects.length) {
    console.log("No projects found");
    return;
  }

  let { selectedProjects } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "selectedProjects",
      message: "Select projects to perform wipe on",
      choices: projects.projects.map((project) => {
        return {
          name: project.name,
          value: project.$id,
        };
      }),
    },
  ]);

  selectedProjects.forEach(async (project) => {
    // Create API Key
    response = await fetch(
      global.appwriteEndpoint + "/projects/" + project + "/keys",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: cookies,
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
      }
    );

    if (!response.ok && response.status !== 409) {
      console.log("Failed to create API Key");
      console.error(await response.json());
      return;
    }

    let apiKey = await response.json();
    apiKey = apiKey.secret;

    // Wipe Authentication
    let appwrite = new Client();
    appwrite
        .setEndpoint(global.appwriteEndpoint)
        .setKey(apiKey)
        .setProject(project);

    let authentication = new Authentication(selectedResources, appwrite);

    authentication.execute();
  });
}

module.exports = wipeResources;
