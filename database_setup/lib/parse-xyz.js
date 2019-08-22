/**
 * Provides a convenient way to asynchronously parse a specific xyz file into a js object
 */
const fs = require('fs');
const path = require('path');
const util = require('util');
const exists = util.promisify(fs.exists);
const readFile = util.promisify(fs.readFile);
const stat = util.promisify(fs.stat);

module.exports.parse = async (filepath) => {
  const filename = path.parse(filepath).base;
  const validFileNameRegexp = /(\w+)-(\d+)-(\d+).xyz/
  if (!validFileNameRegexp.test(filename)) {
    console.log(`Invalid XYZ filename does not match ${validFileNameRegexp.source}`, filename);
    return;
  }
  const id = filename.match(validFileNameRegexp).slice(1).join('/');

  const contents = (await readFile(filepath)).toString('utf8');
  if (contents.trim().length === 0){
    console.log('parsed file is empty', filepath);
    return;
  }
  const lines = contents.split('\n');
  const tempVar = lines[0].trim().match(/\d+/);
  if (!tempVar || !Number.isFinite(Number(tempVar[0]))){
    console.log('parsed file has unusual clusterSize, ignoring', filepath);
    return;
  };
  const clusterSize = tempVar[0];
  const energy = lines[1].split(/\s/g)[2];
  const coordinates = lines.slice(2).filter(l => l.trim().length > 0).map(l => {
    const pieces = l.split(/\s/g)
    return {
      element: pieces[0].toLowerCase(),
      x: pieces[1],
      y: pieces[2],
      z: pieces[3]
    }
  });
  if (!coordinates || coordinates.length === 0) {
    console.log('Invalid XYZ - missing coordinates', filename)
    return;
  }
  if (energy == null) {
    console.log('Invalid XYZ - missing energy', filename)
    return;
  }
  return { id, clusterSize, energy, coordinates, raw: contents, filename };
};
