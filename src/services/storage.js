const { Storage, InputFile } = require('node-appwrite')
const { faker } = require('@faker-js/faker')
const inquirer = require('inquirer')
const ProgressBar = require('progress')

async function handleStorage (appwrite) {
  const buckets = await generateBuckets(appwrite)

  if (!buckets.length) {
    return
  }

  await generateFiles(appwrite, buckets)
}

async function generateBuckets (appwrite) {
  const storageClient = new Storage(appwrite)

  const { bucketsNo } = await inquirer.prompt([
    {
      type: 'number',
      name: 'bucketsNo',
      message: 'How many buckets would you like to generate?'
    }
  ])

  const buckets = []

  const bar = new ProgressBar('Creating new buckets... [:bar] :current/:total', {
    total: bucketsNo
  })

  for (let i = 0; i < bucketsNo; i += 1) {
    await storageClient
      .createBucket(
        'unique()',
        `${faker.word.adjective()} ${faker.word.noun()}`
      )
      .then((response) => {
        buckets.push(response)
        bar.tick()
      })
  }

  return buckets
}

/**
 *
 * @param {*} chunk
 * @param {Storage} storage
 * @param {String} bucketId
 * @param {String} fileId
 * @param {Number} chunkIndex
 * @param {*} totalChunks
 * @returns
 */
async function uploadChunkToAppwrite (
  chunk,
  storage,
  bucketId,
  fileId,
  chunkIndex,
  totalChunks
) {
  const blob = new Blob([chunk])
  const inputFile = await InputFile.fromBlob(
    blob,
    `${faker.person.firstName()}.jpg`
  )

  const headers = chunkIndex === 0 ? {} : { 'x-appwrite-id': fileId }
  return storage.createFile(bucketId, fileId, inputFile, undefined)
}

async function fetchChunk (url, startByte, endByte) {
  const headers = new Headers({
    Range: `bytes=${startByte}-${endByte}`
  })

  const response = await fetch(url, { headers })
  return response.arrayBuffer()
}

async function fetchTotalSize (url) {
  const response = await fetch(url, { method: 'HEAD' })
  return parseInt(response.headers.get('Content-Length'), 10)
}

async function streamUploadFromURL (url, storageClient, bucketId) {
  const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB
  const totalSize = await fetchTotalSize(url)

  let fileId = null

  for (let i = 0; i < totalSize; i += CHUNK_SIZE) {
    const endByte = Math.min(i + CHUNK_SIZE - 1, totalSize - 1)

    const chunk = await fetchChunk(url, i, endByte)
    const response = await uploadChunkToAppwrite(
      chunk,
      storageClient,
      bucketId,
      fileId || '',
      Math.floor(i / CHUNK_SIZE),
      Math.ceil(totalSize / CHUNK_SIZE)
    )

    if (!fileId) {
      fileId = response.$id
    }
  }

  return fileId
}

async function generateFiles (appwrite, buckets) {
  const storageClient = new Storage(appwrite)

  const { filesNo } = await inquirer.prompt([
    {
      type: 'number',
      name: 'filesNo',
      message: 'How many files would you like to generate per bucket?'
    }
  ])

  const bar = new ProgressBar(
    'Uploading files (This may take a while) ... [:bar] :current/:total',
    {
      total: buckets.length * filesNo
    }
  )

  for (let i = 0; i < buckets.length; i += 1) {
    const bucket = buckets[i]

    for (let r = 0; r < filesNo; r += 1) {
      const fileURL = getFakeFileURL()

      await streamUploadFromURL(fileURL, storageClient, bucket.$id).then(
        (response) => {
          bar.tick()
        }
      )
    }
  }
}

function getFakeFileURL () {
  let type = faker.helpers.arrayElement([
    'image',
    'video',
    'audio',
    'text',
    'binary'
  ])

  type = 'image' // temp

  switch (type) {
    case 'image':
      return faker.image.urlLoremFlickr({ category: 'cats' })
  }
}

module.exports = {
  handleStorage
}
