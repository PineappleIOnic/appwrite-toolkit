const { faker } = require('@faker-js/faker')
const inquirer = require('inquirer')
const { Databases } = require('node-appwrite')
const ProgressBar = require('progress')

async function generateCollections(appwrite, databases) {
  let collectionsNo;
  if (global.auto) {
    collectionsNo = 5;
  } else {
    collectionsNo = (await inquirer.prompt([
      {
        type: 'number',
        name: 'collectionsNo',
        message: 'How many collections would you like to create per database?',
        default: 5
      }
    ])).collectionsNo;
  }

  const collections = []

  const databaseClient = new Databases(appwrite)

  const bar = new ProgressBar(
    'Creating new collections... [:bar] :current/:total',
    { total: collectionsNo * databases.length }
  )

  for (let i = 0; i < databases.length; i += 1) {
    for (let l = 0; l < collectionsNo; l += 1) {
      await databaseClient.createCollection(
        databases[i].$id,
        'unique()',
        `${faker.word.adjective()} ${faker.word.noun()}`
      ).then((response) => {
        collections.push(response)
        bar.tick()

        return response
      })
    }
  }

  return collections;
}

function generateFakeValue(type) {
  switch (type) {
    case 'string':
      return faker.lorem.word()
    case 'numeric':
      return Math.floor(Math.random() * 9999999)
    case 'boolean':
      return faker.datatype.boolean()
  }
}

async function generateDocuments(appwrite, collections) {
  let documentsNo;
  if (global.auto) {
    documentsNo = 25;
  } else {
    documentsNo = (await inquirer.prompt([
      {
        type: 'number',
        name: 'documentsNo',
        message:
          'How many documents would you like to generate per collection? (This will also generate attributes)',
        default: 25,
      }
    ])).documentsNo;
  }

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

    for (let i = 0; i < Math.floor(Math.random() * 15) + 5; i += 1) {
      const type = faker.helpers.arrayElement(['string', 'numeric', 'boolean']) // TODO: Add more

      let key = faker.word
        .sample()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
      if (key.length > 30) {
        key = key.substring(0, 30)
      }

      // Add a number to the end of the key
      key = `${key}_${i}`

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

    const expectAttributes = async (iteration = 1) => {
      if (iteration > 15) {
        return false;
      }

      const { attributes } = await databaseClient.listAttributes(
        collection.databaseId,
        collection.$id,
        ['limit(100)']
      );

      const unreadyAttribute = attributes.find((attribute) => {
        return attribute.status !== 'available';
      });

      if (unreadyAttribute) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return await expectAttributes(iteration + 1);
      }

      return true;
    };

    const success = await expectAttributes();

    if (!success) {
      throw new Error('Attributes were not created in time.');
    }
  }

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

async function generateDatabase(appwrite) {
  const databaseClient = new Databases(appwrite)

  let databaseNo;
  if (global.auto) {
    databaseNo = 2;
  } else {
    databaseNo = (await inquirer.prompt([
      {
        type: 'number',
        name: 'databaseNo',
        message: 'How many databases would you like to generate?',
        default: 2
      }
    ])).databaseNo;
  }

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

async function handleDatabases(appwrite) {
  const databases = await generateDatabase(appwrite, projects)

  if (!databases.length) {
    return
  }

  const collections = await generateCollections(appwrite, databases, projects)

  if (!collections.length) {
    return
  }

  await generateDocuments(appwrite, collections, projects)
}

module.exports = {
  handleDatabases
}
