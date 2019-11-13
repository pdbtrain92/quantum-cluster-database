const fs = require('fs');
const path = require('path');
const dotenvPath = path.resolve(__dirname, '../.env');
// configures environment variables
if (fs.existsSync(dotenvPath)) {
  require('dotenv').config({
    path: dotenvPath
  });
}

const knexLib = require('knex');
const data = require('./lib/parse-correlations-from-csv');
const { parseFilesInDir } = require('./lib/parse-dir');
const keys = ['DB_HOST', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE', 'DB_PORT'];

const missingVariables = keys.filter(key => !process.env[key]);
if (missingVariables.length > 0) {
  console.log(`Please set environment variables ${missingVariables.join(', ')}.`);
  process.exit(1);
}

const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE
};

const knex = knexLib({
  client: 'pg',
  connection: config,
  acquireConnectionTimeout: 5000 // 5s is a long time to wait for a database connection
});

// note all the filenames should only be inserted once
// each entity tracks its original filename
const filenamesSet = new Set();

const Run = async () => {
  await knex.raw('select 1');
  await knex.migrate.latest({
    directory: path.resolve(__dirname, './changesets'),
    schemaName: 'public',
    database: config.database,
    tableName: 'knex_changesets'
  });
  console.log('Migrations complete');
  const correlations = data.mapped.map(correlationRow => {
    return {
      left_element: correlationRow.left,
      right_element: correlationRow.right,
      correlation: correlationRow.correlation
    }
  });
  await knex.truncate('correlation');
  console.log('Truncated existing correlation table');
  await knex('correlation').insert(correlations);
  console.log('Correlation data loaded');
  console.log('Truncated existing XYZ table data');
  await knex.truncate('xyz');
  await knex.truncate('info');
  await knex.truncate('ccd_dft');

  let total = 0;
  console.log(path.resolve(__dirname, './data'));
  await parseFilesInDir(path.resolve(__dirname, './data'), async(results) => {
    total += results.length;
    console.log('Loading', results.length,' XYZs, INFOs, DFTs and CCDs from disk.', 'Total: ', total);
    const kinds = {
      xyz: {
        data: [],
        mapper: data => ({
          id: data.id,
          element: data.coordinates[0].element, // for now assume only the same elements bound together
          filename: path.parse(data.filename).base,
          raw: data.raw,
          energy: data.energy,
          cluster_size: data.clusterSize,
          coordinates: JSON.stringify(data.coordinates)
        })
      },
      info: {
        data: [],
        //{nMinusOne, nPlusOne, gap, valence, similarities}
        mapper: data => ({
          id: data.id,
          filename: path.parse(data.filename).base,
          element: data.id.split('/').shift(),
          minus_one: data.nMinusOne,
          plus_one: data.nPlusOne,
          homo_lumo_gap: data.gap,
          valence_electrons: data.valence,
          similarities: JSON.stringify(data.similarities),
          raw: data.raw,
        })
      },
      dft: {
        data: [],
        mapper: data => ({
          id: data.id,
          kind: 'dft',
          filename: path.parse(data.filename).base,
          element: data.id.split('/').shift(),
          source: data.source,
          locations: JSON.stringify(data.locations),
          raw: data.raw
        })
      },
      ccd: {
        data: [],
        mapper: data => ({
          id: data.id,
          kind: 'ccd',
          filename: path.parse(data.filename).base,
          element: data.id.split('/').shift(),
          source: data.source,
          locations: JSON.stringify(data.locations),
          raw: data.raw
        })
      },
    }

    // bucket each kind of parse result so they can be inserted into different tables
    results.forEach(r => {
      if (!r.kind) {
        console.log('unknown kind', r.kind);
        return;
      }
      if (!r.data.filename) {
        console.log('unknown filename', r);
        return;
      }
      if (filenamesSet.has(path.parse(r.data.filename).base)) {
        console.log('Skipping duplicate insert', path.parse(r.data.filename).base)
        return;
      }
      filenamesSet.add(path.parse(r.data.filename).base)
      kinds[r.kind].data.push(kinds[r.kind].mapper(r.data));
    });

    const allKinds = Object.keys(kinds);

    for (let kind of allKinds) {
      while (kinds[kind].data.length > 0) {
        const isDftCcd = ['dft', 'ccd'].includes(kind);
        const table = isDftCcd ? 'ccd_dft' : kind;
        await knex(table).insert(kinds[kind].data.splice(0, 400));
      };
    }
    console.log('Data files loaded into postgres');

  });
  console.log('Completed successfully');
  process.exit(0);
}

Run().catch(e => {
  console.log(e);
  process.exit(1);
})
