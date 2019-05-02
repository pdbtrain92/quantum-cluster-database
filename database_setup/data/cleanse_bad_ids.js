const path = require('path');
const fs = require('fs');
const dataDir = __dirname;
const badIdFiles = fs.readFileSync(path.resolve(dataDir, './_bad_ids.dat')).toString().split(/\s?\n/g);
console.log(badIdFiles.length);

const directories = fs.readdirSync(dataDir);
const xyzs = new Map();
for (let d of directories) {
  const stat = fs.statSync(path.resolve(dataDir, d));
  if (stat.isDirectory()) {
    const files = fs.readdirSync(path.resolve(dataDir, d));
    files.forEach(file => {
      xyzs.set(file.toLowerCase(), path.resolve(dataDir, d, file));
    });
  }
}

badIdFiles.map(file => {
  const [el, size, letter] = file.split(/\-/g);
  const filename =  (file + '.xyz').toLowerCase();
  if (xyzs.get(filename)) {
    console.log('deleting file',xyzs.get(filename));
    fs.unlinkSync(xyzs.get(filename))
  }
})