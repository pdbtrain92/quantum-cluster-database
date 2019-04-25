/**
 * This file checks that environment variables are set, and exposes them to the rest of the backend js code
 */
const logging = require('./logging');
const appEvents = require('./app-events');
const keys = ['SERVER_PORT', 'DB_HOST', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE', 'DB_PORT'];

const missingVariables = keys.filter(key => !process.env[key]);
if (missingVariables.length > 0) {
  logging.error(`Please set environment variables ${missingVariables.join(', ')}.`);
  appEvents.exit(); // triggers a graceful shutdown, flushes the logs
}

module.exports = {
  port: process.env.SERVER_PORT,
  pghost: process.env.DB_HOST,
  pguser: process.env.DB_USERNAME,
  pgpass: process.env.DB_PASSWORD,
  pgport: process.env.DB_PORT,
  pgdb: process.env.DB_DATABASE
};
