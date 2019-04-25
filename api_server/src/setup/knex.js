const logger = require('./logging');
const knexLib = require('knex');
const config = require('./config-from-env');
const { exit } = require('./app-events');

const tryInitialize = async () => {
  const knex = knexLib({
    client: 'pg',
    connection: {
      database: config.pgdb,
      host: config.pghost,
      user: config.pguser,
      password: config.pgpass,
      port: config.pgport
    },
    pool: {
      min: 8,
      max: 30 // note default max connections overall for a pg server is 100
    },
    acquireConnectionTimeout: 5000 // 5s is a long time to wait for a database connection
  });

  await knex.raw('select 1'); // test connection success

  return knex;
};

module.exports.initialize = async () => {
  const maxAttempts = 10;
  for (let i = 0; i < maxAttempts; ++i) {
    try {
      logger.info('Attempting to connect to database', {
        attempt: i,
        database: config.pgdb,
        host: config.pghost,
        user: config.pguser,
        port: config.pgport
      });
      const knex = await tryInitialize();
      setInterval(async () => {
        try {
          await knex.raw('select 1'); // test connection success
        } catch (err) {
          logger.info(`Connection test failure, shutting app down since database is unreachable`);
          exit(1);
        }
      }, 10000 /* 10s */);
      return knex;
    } catch (err) {
      logger.error(`Connection failure: ${err.message}`);
      await new Promise((resolve, reject) => setTimeout(resolve, 1000/* time between attempts */));
    }
  }
  logger.error(`Failed to connect to database after ${maxAttempts} attempts. shutting down.`);
  exit(1);
};
