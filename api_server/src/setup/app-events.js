// to properly exit a process, flushing logs to disk safely
/**
 * This file manages graceful shutdown
 */

const logger = require('./logging');
const EventEmitter = require('events').EventEmitter;

const systemEvents = new EventEmitter();

const cleanupHooks = [];

// debounce emissions of exit so no need for statefulness around
// "shutting down". just handle the exit event once
systemEvents.once('exit', async (code = 0) => {
  for (let hook of cleanupHooks) {
    try {
      await hook();
    } catch (err) {
      // if cleanup fails on shutdown, then system is likely failing and this error is not helpful
      // e.g. database destroy failed when database credentials invalid
    }
  }
  logger.destroy();
  logger.once('close', () => {
    process.exit(code); // non-zero exit codes take their proper effect
  });
});

const appEvents = {
  exit: (code) => systemEvents.emit('exit', code),
  registerForCleanup: (cleanup) => cleanupHooks.push(cleanup)
};

process.once('SIGINT', (...args) => { // when someone soft-kills the app
  logger.info(`SIGINT`);
  appEvents.exit();
});

module.exports = appEvents;