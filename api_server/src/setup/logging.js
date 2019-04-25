const path = require('path');
const logLibrary = require('winston');
const fs = require('fs');
const util = require('util');
const readdir = util.promisify(fs.readdir);
const unlink = util.promisify(fs.unlink);
const stat = util.promisify(fs.stat);
// for now we can use default pm2 output
const logRotationTransport = require('winston-daily-rotate-file');
const logDir = path.resolve(__dirname, '../../../logs');
const rotator = new logRotationTransport({
  maxSize: '10m',
  filename: 'log',
  dirname: logDir
});

rotator.on('rotate', async() => {
  try {
    const files = await readdir(logDir);
    let stats = await Promise.all(files.map(f => `${logDir}/${f}`).map(async f => {
      return { name: f, stats: await stat(f) }
    }));
    stats = stats
      .sort((a,b) => a.stats.birthtimeMs - b.stats.birthtimeMs)
      .filter(s => s.name.includes('log'));
    if (stats.length > 10) {
      logger.info(`Deleting old logs ${stats.slice(0, -10).map(f => f.name).join(',')}`);
      await Promise.all(stats.slice(0, -10).map(s => unlink(s.name)));
    }
  } catch (err) {
    // do nothing, rotation cleanup failed
  }
})

// logging with winston.js
const logger = logLibrary.createLogger({
  format: logLibrary.format.combine(
    logLibrary.format(info => Object.assign(info, { timestamp: new Date().toISOString(), pid: process.pid }))(),
    logLibrary.format.json()
  ),
  transports: [
    rotator
    // new logLibrary.transports.Console({
    //   format: logLibrary.format.colorize()
    // })
  ]
});

module.exports = logger;