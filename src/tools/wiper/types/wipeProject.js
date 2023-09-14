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

    if (!projects.projects.length) {
        console.log("No projects found");
        return;
    }

    let { selectedProjects }  = await inquirer.prompt([
        {
            type: "checkbox",
            name: "selectedProjects",
            message: "Select projects to delete",
            choices: projects.projects.map((project) => {
                return {
                    name: project.name,
                    value: project.$id,
                    children: [
                        {
                            name: "Delete",
                            value: "delete",
                        },
                    ],
                };
            }),
        },
    ]);

    console.log("Are you 100% sure? This will delete the following project's resources (skipping API Keys):");
    if (!selectedProjects.length) {
        console.log("No project selected");
        return;
    }
    console.log(selectedProjects.map((project) => "• "+project).join("\n"));

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

    for (const project of selectedProjects) {
        if (project.delete) {
            // Delete All Users
            
        }
    }
}