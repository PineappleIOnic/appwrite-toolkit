const inquirer = require("inquirer");
const TreePrompt = require("inquirer-tree-prompt");
const { createAdminCookies } = require("../../../utils/getAppwrite");
inquirer.registerPrompt("tree", TreePrompt);

module.exports = async function () {
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

    console.log("Are you 100% sure? This will delete the following projects:");
    console.log(projects.projects.map((project) => "• "+project.name).join("\n"));

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

    for (const project of projects.projects) {
        await fetch(global.appwriteEndpoint + "/projects/" + project.$id, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                cookie: cookies,
            },
        });
    }

    console.log("Projects delete successfully");
}