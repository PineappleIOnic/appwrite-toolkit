const { faker } = require('@faker-js/faker')
const inquirer = require('inquirer')
const { Databases } = require('node-appwrite')
const ProgressBar = require('progress')

async function generateCollections (appwrite, databases) {
  const { collectionsNo } = await inquirer.prompt([
    {
      type: 'number',
      name: 'collectionsNo',
      message: 'How many collections would you like to create per database?'
    }
  ])

  const databaseClient = new Databases(appwrite)

  const bar = new ProgressBar(
    'Creating new collections... [:bar] :current/:total',
    { total: collectionsNo * databases.length }
  )

  const promises = databases.flatMap((database) =>
    Array.from({ length: collectionsNo }, () =>
      databaseClient.createCollection(
        database.$id,
        'unique()',
                `${faker.word.adjective()} ${faker.word.noun()}`
      )
    )
  )

  const collections = await Promise.all(promises)

  collections.flat().forEach(() => bar.tick())

  return collections.flat()
}

function generateFakeValue (type) {
  switch (type) {
    case 'string':
      return faker.lorem.word()
    case 'numeric':
      return Math.floor(Math.random() * 9999999)
    case 'boolean':
      return faker.datatype.boolean()
  }
}

async function generateDocuments (appwrite, collections) {
  const { documentsNo } = await inquirer.prompt([
    {
      type: 'number',
      name: 'documentsNo',
      message:
        'How many documents would you like to generate per collection? (This will also generate attributes)'
    }
  ])

  const databaseClient = new Databases(appwrite)

  // Create Attributes
  let bar = new ProgressBar('Creating attributes... [:bar] :current/:total', {
    total: collections.length
  })

  const schemas = {}

  for (let s = 0; s < collections.length; s += 1) {
    // Generate our schema
    const collection = collections[s]
    const collectionSchema = []

    for (let i = 0; i < Math.floor(Math.random() * 20); i += 1) {
      const type = faker.helpers.arrayElement(['string', 'numeric', 'boolean']) // TODO: Add more

      let key = faker.random
        .word()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
      if (key.length > 36) {
        key = key.substring(0, 36)
      }

      const isRequired = faker.datatype.boolean()

      const attribute = {
        name: key,
        type,
        default: isRequired ? null : generateFakeValue(type),
        required: isRequired,
        collection: collection.$id
      }

      switch (type) {
        case 'string':
          databaseClient.createStringAttribute(
            collection.databaseId,
            collection.$id,
            attribute.name,
            128,
            attribute.required,
            attribute.default
          )
          break
        case 'numeric':
          databaseClient.createIntegerAttribute(
            collection.databaseId,
            collection.$id,
            attribute.name,
            attribute.required,
            0,
            9999999,
            attribute.default
          )
          break
        case 'boolean':
          databaseClient.createBooleanAttribute(
            collection.databaseId,
            collection.$id,
            attribute.name,
            attribute.required,
            attribute.default
          )
          break
      }

      collectionSchema.push(attribute)
    }

    bar.tick()
    schemas[collection.$id] = collectionSchema
  }

  console.log('Waiting a couple of seconds for attributes to be created...')
  await new Promise((resolve) => setTimeout(resolve, 5000))

  // Create Documents
  bar = new ProgressBar('Creating documents... [:bar] :current/:total', {
    total: collections.length * documentsNo
  })

  for (let r = 0; r < collections.length; r += 1) {
    const collection = collections[r]
    const schema = schemas[collection.$id]

    for (let i = 0; i < documentsNo; i += 1) {
      const document = {}

      for (let r = 0; r < schema.length; r += 1) {
        const attribute = schema[r]

        if (!attribute.required) {
          if (Math.random() < 0.5) {
            continue
          }
        }

        document[attribute.name] = generateFakeValue(attribute.type)
      }

      try {
        await databaseClient.createDocument(
          collection.databaseId,
          collection.$id,
          'unique()',
          document
        )
        bar.tick()
      } catch (error) {
        console.log(error)
      }
    }
  }
}

async function generateDatabase (appwrite) {
  const databaseClient = new Databases(appwrite)

  const { databaseNo } = await inquirer.prompt([
    {
      type: 'number',
      name: 'databaseNo',
      message: 'How many databases would you like to generate?'
    }
  ])

  const databases = []

  const bar = new ProgressBar(
    'Creating new databases... [:bar] :current/:total',
    { total: databaseNo }
  )

  for (let i = 0; i < databaseNo; i += 1) {
    await databaseClient
      .create('unique()', `${faker.word.adjective()} ${faker.word.noun()}`)
      .then((response) => {
        databases.push(response)
        bar.tick()

        return response
      })
  }

  return databases
}

async function handleDatabases (appwrite) {
  const databases = await generateDatabase(appwrite)

  if (!databases.length) {
    return
  }

  const collections = await generateCollections(appwrite, databases)

  if (!collections.length) {
    return
  }

  await generateDocuments(appwrite, collections)
}

module.exports = {
  handleDatabases
}
