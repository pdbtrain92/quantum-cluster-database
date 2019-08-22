process.env.NODE_ENV = 'production'; // turn off any libraries defaulting to debug mode


const fs = require('fs');
const path = require('path');
const dotenvPath = path.resolve(__dirname, '../.env');
const logger = require('./src/setup/logging');
const appEvents = require('./src/setup/app-events');
if (appEvents.exiting) {
  return;
}
// configures environment variables
logger.info(`Loading environment from`, {dotenvPath});
if (fs.existsSync(dotenvPath)) {
  require('dotenv').config({
    path: dotenvPath
  })
}
// has to come after dotenv
const dataLayer = require('./src/data-layer');

const compression = require('compression');
const cors = require('cors');
const config = require('./src/setup/config-from-env');
const express = require('express');

const uuid = require('uuid');
const { initialize } = require('./src/setup/knex');
const app = express();

async function Run() {
  const knex = await initialize();
  logger.info('knex initialized successfully');

  app.use(compression()); // turn on gzip
  app.use(cors()); // allow cross origin requests
  // de-serializes any json payloads passed to the api
  // so that they can be accessed at req.body as a json object
  app.use(express.json());
  // access logs
  app.use((req, res, next) => {
    req.uuid = uuid.v4();
    req.startTime = Date.now(); // milliseconds
    if (!req.path.includes('static')) {
      logger.info(`${req.uuid} ${req.method || 'GET'} ${req.url} from ${req.ip}`);
    }
    next();
  });

  const makeHandler = (wrapped) => {
    return async (req, res, next) => {
      try {
        await wrapped(req, res);
      } catch (err) {
        logger.error('Route failed: ' + err.message)
        res.json({
          error: {
            code: 500,
            message: 'Internal server error'
          }
        });
      } finally {
        next(); // exec any post-middleware
      }
    }
  }

  app.get('/correlations/:element', makeHandler(async (req, res) => {
    const values = await knex('correlation').where({ left_element: req.params.element }).select([
      'left_element as left',
      'right_element as right',
      'correlation',
    ]);
    res.json({ values });
  }));

  app.get('/xyz-id/:element/:cluster/:structure', makeHandler(async (req, res) => {
    const id = `${req.params.element}/${req.params.cluster}/${req.params.structure}`;
    const values = await dataLayer.getXyzById(id);
    res.json({ values });
  }));

  app.get('/xyz/:element/:cluster', makeHandler(async (req, res) => {
    const values = await dataLayer.getXyz(
      req.params.element,
      req.params.cluster
    );
    res.json({ values });
  }));

  // returns all xyzs, correlation, ccd, dft, info
  app.get('/elements/:element', makeHandler(async (req, res) => {
    const values = await dataLayer.getElement(
      req.params.element,
    );
    res.json({ values });
  }));
  // dft, info, ccd have ids like Ag/10/1 - this is a way of accessing those directly
  // because in the info file they reference "similar" ones via ids of that structure.
  app.get('/ids/:element/:cluster/:structure', async(req, res) => {
    const id = `${req.params.element}/${req.params.cluster}/${req.params.structure}`;
    const values = await dataLayer.getInfoDftAndCcdById(id);
    res.json({ values });
  })

  app.use(express.static(path.resolve(__dirname, "../static")));

  app.listen(config.port, () => {
    logger.info(`App listening on port ${config.port}`);
  });
}
process.nextTick(() => {
  Run().catch(e => {
    logger.error(`Top level app error`, e);
    logger.close();
    logger.on('close', () => {
      process.exit(1);
    });
  });
});
