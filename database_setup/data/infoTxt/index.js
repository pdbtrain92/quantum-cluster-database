const fs = require('fs');
const util = require('util');
const exists = util.promisify(fs.exists);
const readFile = util.promisify(fs.readFile);
const stat = util.promisify(fs.stat);
const readdir = util.promisify(fs.readdir);
const path = require('path');

const parsers = [
  {
    kind: 'xyz',
    matcher: filename => path.parse(filename).ext === '.xyz',
    parse: async (filename) => {}
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
      const nMinusOne = (lines[0].match(/Formation energy \(N-1 -> N\):(\s?([-+]?[0-9]*\.?[0-9]*)?\s?)eV/))[1].trim() || null;
      const nPlusOne = (lines[1].match(/Formation energy \(N\+1 -> N\):(\s?([-+]?[0-9]*\.?[0-9]*)?\s?)eV/))[1].trim() || null;
      const gap = (lines[2].match(/HOMO-LUMO gap:(\s?([-+]?[0-9]*\.?[0-9]*)?\s?)eV/))[1].trim() || null;
      const valence = (lines[3].match(/Number of valence electrons: (\d+) electrons/))[1] || null;
      const similar = lines[4].substring('Similar structure(s): '.length).split(/\s+/gm);
      return {nMinusOne, nPlusOne, gap, valence, similar}
    }
  },
  {
    kind: 'dft',
    matcher: filename => path.parse(filename).base.match(/\w+-\d+-\d+-dft.txt/),
    parse: async (filename) => {
      const contents = (await readFile(filename)).toString();
      const lines = contents.split(/\r?\n/gm);
      // console.log(lines)
    }
  },
  {
    kind: 'ccd',
    matcher: filename => path.parse(filename).base.match(/\w+-\d+-\d+-ccd.txt/),
    parse: async (filename) => {
      
    }
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

const parseFile = (filename) => {
  const parser = findParser(filename);
  if (!parser) {
    console.log('Skipping file', filename);
    return null;
  }
  console.log(parser)
  return parser.parse(filename);
}

const parseFilesInDir = async (dirPath, handler) => {
  const files = [];
  await detectAllParsableFilesInDirRecurse(dirPath, files);
  while(files.length > 0) {
    const results = await Promise.all(files.splice(0, 1000).map(file => parseFile(file)));
    await handler(results.filter(el => !!el));
  };
};

parseFilesInDir('.', () => {})