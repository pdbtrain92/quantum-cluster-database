const fs = require('fs');
const path = require('path');
const util = require('util');
const { parse: parseXyz } = require('./parse-xyz')
// const exists = util.promisify(fs.exists);
const readFile = util.promisify(fs.readFile);
const stat = util.promisify(fs.stat);
const readdir = util.promisify(fs.readdir);

const dftCcdFileParser = async (filename) => {
  const contents = (await readFile(filename)).toString();
  const lines = contents.split(/\r?\n/gm);
  const id = lines[0].split(/\s/gm).pop().trim().replace('dft/', '') || null;
  const source = lines[1].split(/\s/gm).pop().trim() || null;
  const locations = lines.slice(2).map(l => l.split(/\s/gm).pop().trim()).filter(l => l.length > 0);
  return {id, source, locations, raw: contents, filename};
}

const parsers = [
  {
    kind: 'xyz',
    matcher: filename => path.parse(filename).ext === '.xyz',
    parse: parseXyz
  },
  {
    kind: 'info',
    matcher: filename => path.parse(filename).base.match(/\w+-\d+-\d+.txt/),
    parse: async (filename) => {
      const contents = (await readFile(filename)).toString();
      const lines = contents.split(/\r?\n/gm);
      if (lines.length < 5) {
        console.log('File', filename, 'has invalid structure because it has too few lines, and parsing failed');
        return null;
      }
      const id = path.parse(filename).base.split('.')[0].replace('dft-', '').replace(/(\-)/gm, '/').trim();
      let nMinusOne = (lines[0].match(/Formation energy \(N-1 -> N\):(\s?([-+]?[0-9]*\.?[0-9]*)?\s?)eV/)) || null;
      if (nMinusOne){
        nMinusOne = nMinusOne[1].trim();
      }else{
        nMinusOne = 'n/a';
      };
      let nPlusOne = (lines[1].match(/Formation energy \(N\+1 -> N\):(\s?([-+]?[0-9]*\.?[0-9]*)?\s?)eV/)) || null;
      if (nPlusOne){
        nPlusOne = nPlusOne[1].trim();
      }else{
        nPlusOne = 'n/a';
      };
      let gap = (lines[2].match(/HOMO-LUMO Gap: (\s?([-+]?[0-9]*\.?[0-9]*)?\s?)eV/)) || null;
      if (gap){
        gap = gap[1].trim();
      }else{
        gap = 'n/a';
      };
      //let valence = (lines[3].match(/Number of valence electrons:\s?(\d+)?\s?electrons/)) || null;
      let valence = (lines[3].match(/Number of valence electrons: (\s?([-+]?[0-9]*\.?[0-9]*)?\s?)electrons/)) || null;
      if (valence){
        valence = valence[1].trim();
      }else{
        valence = 'n/a';
      };
      const similarities = lines[4].substring('Similar structure(s): '.length).split(/\s+/gm);
      return {id, nMinusOne, nPlusOne, gap, valence, similarities, raw: contents, filename}
    }
  },
  /**
   * DFT and CCD should have the same format
   *
   * QCD ID: dft/Ni/11/1
   * Source: https://doi.org/10.1039/C7CP02240A
   * Location: literature/dft/Ni/c7cp02240a1.pdf
   * Location: literature/dft/Ni/c7cp02240a.pdf
   */
  {
    kind: 'dft',
    matcher: filename => path.parse(filename).base.match(/\w+-\d+-\d+-dft.txt/),
    parse: dftCcdFileParser
  },
  {
    kind: 'ccd',
    matcher: filename => path.parse(filename).base.match(/\w+-\d+-\d+-ccd.txt/),
    parse: dftCcdFileParser
  }
]

const findParser = (filename) => {
  return parsers.find(p => p.matcher(filename));
}

const categorizeListing = (basePath, listing, directories, files) => {
  return Promise.all(listing.map(async listingName => {
    const resolvedName = path.resolve(basePath, listingName);
    const dirStat = await stat(resolvedName);
    if (dirStat.isDirectory()) {
      directories.push(resolvedName);
    }
    else if (findParser(resolvedName)) {
      files.push(resolvedName);
    }
  }));
}

const detectAllParsableFilesInDirRecurse = async (parentDir, files) => {
  const directories = [];
  const listing = await readdir(parentDir);
  await categorizeListing(parentDir, listing, directories, files);
  await Promise.all(directories.map(dir => detectAllParsableFilesInDirRecurse(dir, files)))
}

const parseFile = async (filename) => {
  const parser = findParser(filename);
  if (!parser) {
    console.log('Skipping file', filename);
    return null;
  }
  const data = await parser.parse(filename);
  if (!data) {
    console.log('Parser returned no value for', filename);
    return null;
  }
  return { data: await parser.parse(filename), kind: parser.kind };
}

module.exports.parseFilesInDir = async (dirPath, handler) => {
  const files = [];
  await detectAllParsableFilesInDirRecurse(dirPath, files);
  while(files.length > 0) {
    const results = await Promise.all(files.splice(0, 1000).map(file => parseFile(file)));
    await handler(results.filter(el => !!el));
  };
};
