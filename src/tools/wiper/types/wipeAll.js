const inquirer = require("inquirer");
const TreePrompt = require("inquirer-tree-prompt");
const { createAdminCookies } = require("../../../utils/getAppwrite");
inquirer.registerPrompt("tree", TreePrompt);
const ProgressBar = require("progress");

module.exports = async function () {
  const cookies = await createAdminCookies();

  // Fetch All Projects
  let projects = [];

  while (true) {
    const data = {
      limit: 6,
      offset: projects.length,
      orderType: "DESC",
    };

    let response = await fetch(
      global.appwriteEndpoint +
        "/projects?" +
        new URLSearchParams(data).toString(),
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          cookie: cookies,
        },
      }
    );

    if (!response.ok && response.status !== 409) {
      console.log("Failed to fetch projects");
      console.error(await response.json());
      return;
    }

    let responseParsed = await response.json();

    projects = [...projects, ...responseParsed.projects];
    projects = projects.filter(
      (project, index, self) =>
        self.findIndex((p) => p.$id === project.$id) === index
    );

    if (responseParsed.total <= projects.length) {
      break;
    }
  }

  console.log("Are you 100% sure? This will delete the following projects:");
  if (!projects.length) {
    console.log("No projects found");
    return;
  }
  console.log(projects.map((project) => "• " + project.name).join("\n"));
  console.log("Discovered: " + projects.length + " projects");

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

  for (const project of projects) {
    await fetch(global.appwriteEndpoint + "/projects/" + project.$id, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        cookie: cookies,
      },
    });
  }

  console.log("Projects delete successfully");
};
