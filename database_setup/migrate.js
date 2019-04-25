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
const { parseAllXyzFilesInDir } = require('./lib/parse-all-xyz-in-dir');
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
  await knex('correlation').insert(correlations);
  console.log('Correlation data inserted');

  await knex.truncate('xyz');
  const xyzs = await parseAllXyzFilesInDir(path.resolve(__dirname, './data'));
  console.log('Read XYZs from disk');
  const xyzsMappedForDatabase = xyzs.map(file => {
    return {
      element: file.coordinates[0].element, // for now assume only the same elements bound together
      filename: file.name,
      raw: file.raw,
      energy: file.energy,
      cluster_size: file.clusterSize,
      coordinates: JSON.stringify(file.coordinates)
    }
  });
  await knex('xyz').insert(xyzsMappedForDatabase);
  console.log('XYZs loaded into postgres')
  process.exit(0);
}

Run().catch(e => {
  console.log(e);
  process.exit(1);
})