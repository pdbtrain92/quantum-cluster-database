process.env.NODE_ENV = 'production'; // turn off any libraries defaulting to debug mode

const fs = require('fs');
const path = require('path');
const dotenvPath = path.resolve(__dirname, '../.env');
const logger = require('./src/setup/logging');

// configures environment variables
logger.info(`Loading environment from`, {dotenvPath});
if (fs.existsSync(dotenvPath)) {
  require('dotenv').config({
    path: dotenvPath
  })
}

const compression = require('compression');
const cors = require('cors');
const config = require('./src/setup/config-from-env');
const express = require('express');

const uuid = require('uuid');
const { initialize } = require('./src/setup/knex');
const app = express();
const server = app.listen(5432, () => {});
app.use(express.static("./static"));

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
    logger.info(`${req.uuid} ${req.method || 'GET'} ${req.url} from ${req.ip}`);
    next();
  });

  app.get('/correlations/:element', async (req, res, next) => {
    try {
      const values = await knex('correlation').where({ left_element: req.params.element }).select([
        'left_element as left',
        'right_element as right',
        'correlation',
      ]);
      res.json({ values });
    } catch (err) {
      res.json({
        error: {
          code: 500,
          message: 'Internal server error'
        }
      });
    } finally {
      next(); // exec any post-middleware
    }
  });

  app.get('/xyz/:element/:cluster', async (req, res, next) => {
    try {
      const values = await knex('xyz').where({
        element: req.params.element,
        cluster_size: req.params.cluster
      }).select([
        'element',
        'filename',
        'raw',
        'coordinates',
        'cluster_size as clusterSize',
        'energy'
      ]);
      res.json({ values });
    } catch (err) {
      res.json({
        error: {
          code: 500,
          message: 'Internal server error'
        }
      });
    } finally {
      next(); // exec any post-middleware
    }
  });

  // post-middleware
  app.use((req, res, next) => {
    logger.info(`${req.uuid} completed with status ${res.statusCode} in ${Date.now() - req.startTime}ms`);
  });

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
app.get('/static',function(req,res)
{
    res.sendFile(path.join(__dirname, './static/index.html'));
})
