const inquirer = require('inquirer')
const { Functions } = require('node-appwrite')
const ProgressBar = require('progress')
const { faker } = require('@faker-js/faker')

async function handleFunctions (appwrite) {
  const functions = await generateFunctions(appwrite)

  if (!functions.length) {

  }

  // let deployments = await generateDeployments(appwrite, functions);
}

async function generateFunctions (appwrite) {
  const functionsClient = new Functions(appwrite)

  const { functionsNo } = await inquirer.prompt([
    {
      type: 'number',
      name: 'functionsNo',
      message: 'How many functions would you like to generate?'
    }
  ])

  const { languages } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'languages',
      message: 'Which languages would you like to generate?',
      choices: [
        {
          name: 'Node.js',
          value: 'node-18.0'
        },
        {
          name: 'PHP',
          value: 'php-8.1'
        },
        {
          name: 'Python',
          value: 'python-3.10'
        }
      ]
    }
  ])

  const functions = []
  const bar = new ProgressBar(
    'Creating new functions... [:bar] :current/:total',
    {
      total: functionsNo
    }
  )

  for (let i = 0; i < functionsNo; i += 1) {
    const runtime = languages[Math.floor(Math.random() * languages.length)]

    await functionsClient
      .create('unique()', `${faker.word.adjective()} ${faker.word.noun()}`, runtime)
      .then((response) => {
        functions.push(response)
        bar.tick()
        return response
      })
  }

  return functions
}

async function generateDeployments (appwrite, functions) {
  const functionsClient = new Functions(appwrite)

  const { deploymentsNo } = await inquirer.prompt([
    {
      type: 'number',
      name: 'deploymentsNo',
      message: 'How many deployments would you like to generate?'
    }
  ])

  const { useLFS } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useLFS',
      message:
        'Would you like to artificially increase the size of the functions? (This will take longer to generate)'
    }
  ])
}

module.exports = {
  handleFunctions
}
