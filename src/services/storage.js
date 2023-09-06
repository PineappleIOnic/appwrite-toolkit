const { Storage, InputFile } = require("node-appwrite");
const { faker } = require("@faker-js/faker");
const inquirer = require("inquirer");
const ProgressBar = require("progress");

async function handleStorage(appwrite) {
  const buckets = await generateBuckets(appwrite);

  if (!buckets.length) {
    return;
  }

  const { useLFS } = await inquirer.prompt([
    {
      type: "confirm",
      name: "useLFS",
      message:
        "Would you like to use Large Files? (This will take significantly longer)",
    },
  ]);

  if (useLFS) {
    const { maxLFSFileSize } = await inquirer.prompt([
      {
        type: "list",
        name: "maxLFSFileSize",
        message: "What is the maximum file size you would like to generate?",
        choices: [
          {
            name: "1MB",
            value: 1 * 1024 * 1024,
          },
          {
            name: "5MB",
            value: 5 * 1024 * 1024,
          },
          {
            name: "10MB",
            value: 10 * 1024 * 1024,
          },
          {
            name: "50MB",
            value: 50 * 1024 * 1024,
          },
          {
            name: "100MB",
            value: 100 * 1024 * 1024,
          },
          {
            name: "500MB",
            value: 500 * 1024 * 1024,
          },
          {
            name: "1GB",
            value: 1024 * 1024 * 1024,
          },
        ],
      },
    ]);
  }

  await generateFiles(appwrite, buckets, useLFS);
}

async function generateBuckets(appwrite) {
  const storageClient = new Storage(appwrite);

  const { bucketsNo } = await inquirer.prompt([
    {
      type: "number",
      name: "bucketsNo",
      message: "How many buckets would you like to generate?",
    },
  ]);

  const buckets = [];

  const bar = new ProgressBar(
    "Creating new buckets... [:bar] :current/:total",
    {
      total: bucketsNo,
    }
  );

  for (let i = 0; i < bucketsNo; i += 1) {
    await storageClient
      .createBucket(
        "unique()",
        `${faker.word.adjective()} ${faker.word.noun()}`
      )
      .then((response) => {
        buckets.push(response);
        bar.tick();
      });
  }

  return buckets;
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
async function uploadChunkToAppwrite(
  chunk,
  storage,
  bucketId,
  fileId,
  chunkIndex,
  totalChunks
) {
  const blob = new Blob([chunk]);
  const inputFile = await InputFile.fromBlob(
    blob,
    `${faker.person.firstName()}.jpg`
  );

  return storage.createFile(bucketId, fileId, inputFile);
}

async function fetchChunk(url, startByte, endByte) {
  const headers = new Headers({
    Range: `bytes=${startByte}-${endByte}`,
  });

  const response = await fetch(url, { headers });

  return response.arrayBuffer();
}

async function fetchTotalSize(url) {
  const response = await fetch(url, { method: "HEAD" });
  return parseInt(response.headers.get("Content-Length"), 10);
}

async function streamUploadFromURL(url, storageClient, bucketId) {
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
  const totalSize = await fetchTotalSize(url);

  let fileId = null;

  for (
    let currentChunk = 0;
    currentChunk < totalSize;
    currentChunk += CHUNK_SIZE
  ) {
    const endByte = Math.min(currentChunk + CHUNK_SIZE - 1, totalSize - 1);

    const chunk = await fetchChunk(url, currentChunk, endByte);
    const response = await uploadChunkToAppwrite(
      chunk,
      storageClient,
      bucketId,
      fileId || "unique()",
      Math.floor(currentChunk / CHUNK_SIZE),
      Math.ceil(totalSize / CHUNK_SIZE)
    );

    if (!fileId) {
      fileId = response.$id;
    }
  }

  return fileId;
}

async function generateFiles(appwrite, buckets, useLFS) {
  const storageClient = new Storage(appwrite);

  const { filesNo } = await inquirer.prompt([
    {
      type: "number",
      name: "filesNo",
      message: "How many files would you like to generate per bucket?",
    },
  ]);

  if (useLFS) {
    console.log('LFs is not yet supported, falling back to regular files');
  }

  const bar = new ProgressBar(
    "Uploading files (This may take a while) ... [:bar] :current/:total",
    {
      total: buckets.length * filesNo,
    }
  );

  for (let i = 0; i < buckets.length; i += 1) {
    const bucket = buckets[i];

    for (let r = 0; r < filesNo; r += 1) {
      const fileURL = useLFS ? getFakeLFSFileURL() : getFakeFileURL();

      await streamUploadFromURL(fileURL, storageClient, bucket.$id).then(
        (response) => {
          bar.tick();
        }
      );
    }
  }
}

function getFakeLFSFileURL() {
  //temp
  return getFakeFileURL();
}

function getFakeFileURL() {
  let type = faker.helpers.arrayElement([
    "image",
    "video",
    "audio",
    "text",
    "binary",
  ]);

  type = "image"; // temp

  switch (type) {
    case "image":
      return faker.image.urlLoremFlickr({ category: "cats" });
  }
}

module.exports = {
  handleStorage,
};
