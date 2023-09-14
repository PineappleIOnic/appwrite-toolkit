/**
 *
 */

class Resource {
  name = "";
  id = "";
  onlyChildren = false;
  decentants = [];

  constructor(name, id, onlyChildren, decentants) {
    this.name = name;
    this.id = id;
    this.onlyChildren = onlyChildren;
    this.decentants = decentants;
  }
}

let resources = {
  auth: new Resource("Auth", "auth", false, [
    new Resource("Users", "users", false, []),
    new Resource("Teams", "teams", false, []),
  ]),

  database: new Resource("Database", "database", false, [
    new Resource("Documents", "documents", false, []),
    new Resource("Collections", "collections", false, []),
  ]),

  storage: new Resource("Storage", "storage", false, [
    new Resource("Buckets", "buckets", false, [
      new Resource("Files", "files", false, []),
    ]),
  ]),

  functions: new Resource("Functions", "functions", false, [
    new Resource("Deployments", "deployments", false, [
        new Resource("Keep latest deployment", "keepLatestDeployment", true, []),
    ]),
  ]),
};

/**
 * Wipe Resources
 *
 * @param {Array} resources
 */
async function wipeResources(resources) {
    let { selectedResources } = await inquirer.prompt([
        {
        type: "checkbox",
        name: "selectedResources",
        message: "Select resources to delete",
        choices: Object.keys(resources).map((resource) => {
            return {
            name: resources[resource].name,
            value: resources[resource].id,
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
    
    console.log(
        "Are you 100% sure? This will delete the following resources (skipping API Keys):"
    );
    console.log(
        selectedResources.map((resource) => "• " + resource).join("\n")
    );
    
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
}
