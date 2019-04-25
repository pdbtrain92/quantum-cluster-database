const fs = require('fs');
const path = require('path');
const util = require('util');
const { parse } = require('./parse-xyz')

// async-friendly versions of some fs apis
// note these are better officially supported in node 12+
// but the edge cases that are impacted should not impact this
const exists = util.promisify(fs.exists);
const readFile = util.promisify(fs.readFile);
const stat = util.promisify(fs.stat);
const readdir = util.promisify(fs.readdir);

const categorizeListing = (basePath, listing, directories, files) => {
  return Promise.all(listing.map(async listingName => {
    const resolvedName = path.resolve(basePath, listingName);
    if (path.parse(listingName).ext === '.xyz') {
      files.push(resolvedName);
    }
    const dirStat = await stat(resolvedName);
    if (dirStat.isDirectory()) {
      directories.push(resolvedName);
    }
  }));
}

const detectAllXyzFilesInDirRecurse = async (parentDir, files) => {
  const directories = [];
  const listing = await readdir(parentDir);
  await categorizeListing(parentDir, listing, directories, files);
  await Promise.all(directories.map(dir => detectAllXyzFilesInDirRecurse(dir, files)))
}

module.exports.parseAllXyzFilesInDir = async (dirPath) => {
  const files = [];
  await detectAllXyzFilesInDirRecurse(dirPath, files);
  return Promise.all(files.map(async file => parse(file)))
}