const inquirer = require('inquirer')
const { Client } = require('node-appwrite')
const { handleAuth } = require('./services/auth')
const { handleDatabases } = require('./services/databases')
const { handleStorage } = require('./services/storage')
const { handleFunctions } = require('./services/functions')
require('dotenv').config()

async function main () {
  const appwrite = new Client()
  appwrite
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setKey(process.env.APPWRITE_API_KEY)
    .setProject(process.env.APPWRITE_PROJECT_ID)

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
