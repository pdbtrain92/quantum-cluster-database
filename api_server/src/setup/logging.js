const logLibrary = require('winston');
// for now we can use default pm2 output
// const logRotationTransport = require('winston-daily-rotate-file');

// logging with winston.js
const logger = logLibrary.createLogger({
  format: logLibrary.format.combine(
    logLibrary.format(info => Object.assign(info, { timestamp: new Date().toISOString(), pid: process.pid }))(),
    logLibrary.format.json()
  ),
  transports: [
    // new logRotationTransport({
    //   filename: 'log',
    //   dirname: process.env.LOG_DIR || './logs'
    // }),
    new logLibrary.transports.Console({
      format: logLibrary.format.colorize()
    })
  ]
});

module.exports = logger;