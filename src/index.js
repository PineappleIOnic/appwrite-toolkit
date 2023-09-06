const inquirer = require('inquirer')
const fs = require('fs')
const { Client } = require('node-appwrite')
const { handleAuth } = require('./services/auth')
const { handleDatabases } = require('./services/databases')
const { handleStorage } = require('./services/storage')
const { handleFunctions } = require('./services/functions')
require('dotenv').config()

async function main () {
  let questions = [
    {
      type: 'input',
      name: 'appwriteEndpoint',
      message: 'What is your Appwrite endpoint?',
      default: process.env.APPWRITE_ENDPOINT ?? 'http://localhost/v1'
    },
    {
      type: 'input',
      name: 'appwriteKey',
      message: 'What is your Appwrite API Key?'
    },
    {
      type: 'input',
      name: 'appwriteProjectID',
      message: 'What is your Appwrite Project ID?'
    }
  ];
  
  if (process.env.APPWRITE_ENDPOINT) {
    questions[0].default = process.env.APPWRITE_ENDPOINT
  }

  if (process.env.APPWRITE_API_KEY) {
    questions[1].default = process.env.APPWRITE_API_KEY
  }

  if (process.env.APPWRITE_PROJECT_ID) {
    questions[2].default = process.env.APPWRITE_PROJECT_ID
  }

  const { appwriteEndpoint, appwriteKey, appwriteProjectID } = await inquirer.prompt(questions);

  fs.writeFileSync('./.env', `APPWRITE_ENDPOINT=${appwriteEndpoint}\nAPPWRITE_API_KEY=${appwriteKey}\nAPPWRITE_PROJECT_ID=${appwriteProjectID}`)

  const appwrite = new Client()
  appwrite
    .setEndpoint(appwriteEndpoint)
    .setKey(appwriteKey)
    .setProject(appwriteProjectID)

  const { services } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'services',
      message: 'Which services do you want to generate data for?',
      choices: [
        {
          name: 'Auth',
          value: 'auth'
        },
        {
          name: 'Databases',
          value: 'databases'
        },
        {
          name: 'Storage',
          value: 'storage'
        },
        {
          name: 'Functions',
          value: 'functions'
        }
      ]
    }
  ])

  // Auth
  if (services.includes('auth')) {
    await handleAuth(appwrite)
  }

  // Databases
  if (services.includes('databases')) {
    await handleDatabases(appwrite)
  }

  // Storage
  if (services.includes('storage')) {
    await handleStorage(appwrite)
  }

  // Functions
  if (services.includes('functions')) {
    await handleFunctions(appwrite)
  }
}

main()
