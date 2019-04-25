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
  const contents = (await readFile(filepath)).toString('utf8');
  const lines = contents.split('\n');
  const clusterSize = lines[0].trim();
  const energy = lines[1].split(/\s/g)[2];
  const coordinates = lines.slice(2).filter(l => l.trim().length > 0).map(l => {
    const pieces = l.split(/\s/g)
    return {
      element: pieces[0].toLowerCase(),
      x: pieces[1],
      y: pieces[2],
      z: pieces[3]
    }
  })
  return { clusterSize, energy, coordinates, raw: contents, name: filename };
};