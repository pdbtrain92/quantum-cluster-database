const fs = require('fs');
const path = require('path');
const parser = require('node-csv-parse');

const data = fs.readFileSync(path.resolve(__dirname, '../data/correlations_best_sort_2.csv')).toString('utf8');

const parsed = parser(data, ',');

const rows = parsed.asRows();
const headers = rows.shift();
const columns = rows.map(row => row.shift()); // ignore header row, take first element of each row for the labels on the left side of the grid
const mapped = [];
for (let header = 0; header < headers.length; ++header) {
  for (let column = 0; column < columns.length; ++column) {
    if (rows[header][column]) {
      mapped.push({
        left: headers[header].toLowerCase(),
        right: columns[column].toLowerCase(),
        correlation: rows[header][column]
      });
    }
  }
}
if (module.parent) {
  // if being required in code, then expose the data in a "mapped" property
  module.exports.mapped = mapped
} else {
  // if just being executed directly, log the json
  console.log(JSON.stringify(mapped, null, 2))
}
