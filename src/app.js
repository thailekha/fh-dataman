'use strict';

import bodyParser from 'body-parser';
import express from 'express';
import fhconfig from 'fh-config';
import cors from 'cors';
import fhcluster from 'fh-cluster';
import fhlogger from 'fh-logger';
import bunyanLogger from 'express-bunyan-logger';
import {argv as args} from 'optimist';
import util from 'util';
import path from 'path';
import fs from 'fs';
import buildEndpoints from './endpoints/http';
import errorHandler from './endpoints/http/error.js';
import {setLogger} from './logger';
import validation from '../config/validation';
import dbConnection from './middleware/dbConnection';

var TITLE = "fh-dataman";
process.env.component = TITLE;
if (!process.env.conf_file) {
  process.env.conf_file = process.argv[2];
}

/**
 * Print out usage info
 */
function usage() {
  /* eslint-disable no-console */
  console.log(`Usage: ${args.$0} <config file> [-d] (debug) --master-only --workers=[int] \n --master-only will override  --workers so should not be used together`);
  /* eslint-enable no-console */
  process.exit(0);
}

if (args.h || args._.length < 1) {
  usage();
}

/**
 * Initialise the configuration object.
 * @return {Promise}
 */
function setupConfig() {
  return new Promise((resolve, reject) => {
    fhconfig.init(process.env.conf_file, validation, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(fhconfig);
      }
    });
  });
}

/**
 * Initialise the logger
 * @param  {fhconfig} fhconfig The fhconfig instance
 * @return {object}   a logger
 */
function setupLogger(fhconfig) {
  const logger = fhlogger.createLogger(fhconfig.getConfig().rawConfig.logger);
  setLogger(logger);
  return logger;
}

/**
 * Setup the handler for the "uncaughtException" event. The handler will print out the error and exit the process.
 * @param  {[type]} logger [description]
 * @return {[type]}        [description]
 */
function setupUncaughtExceptionHandler(logger) {
  // handle uncaught exceptions
  process.on('uncaughtException', err => {
    logger.error(`FATAL: UncaughtException, please report: ${util.inspect(err)}`);
    /* eslint-disable no-console */
    console.error(`${new Date().toString()} FATAL: UncaughtException, please report: ${util.inspect(err)}`);
    /* eslint-enable no-console */
    if (err !== undefined && err.stack !== undefined) {
      logger.error(util.inspect(err.stack));
    }
    /* eslint-disable no-console */
    console.trace(err.stack);
    /* eslint-enable no-console */
    process.exit(1);
  });
}

/**
 * Start a single worker
 * @param  {logger}   logger   a logger instance
 * @param  {fhconfig} fhconfig a fhconfig instance
 */
function startWorker(logger, fhconfig) {
  setupUncaughtExceptionHandler(logger);
  startApp(logger, fhconfig);
}

/**
 * Start the web server
 * @param  {logger}   logger   a logger instance
 * @param  {fhconfig} fhconfig a fhconfig instance
 */
function startApp(logger, fhconfig) {
  const app = express();
  app.use(logger.requestIdMiddleware);
     // Enable CORS for all requests
  app.use(cors());

  // Request logging
  app.use(bunyanLogger({ logger: logger, parseUA: false, genReqId: req => req.header(logger.requestIdHeader) }));

  // Parse JSON payloads
  app.use(bodyParser.json({limit: fhconfig.value('fhmbaas.maxpayloadsize') || "20mb"}));

  // Create db connection for given app
  app.use(dbConnection(fhconfig.mbaasConf));

  // wire up endpoints
  buildEndpoints(app);

  //error handler
  app.use(errorHandler);

  var port = fhconfig.int('port');
  app.listen(port, () => {
    // Get our version number from package.json
    var pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), "utf8"));
    /* eslint-disable no-console */
    console.log(`Started ${TITLE} version: ${pkg.version} at: ${new Date()} on port: ${port}`);
    /* eslint-enable no-console */
  });
}


function main() {
  setupConfig()
  .then(config => {
    const logger = setupLogger(fhconfig);
    return {logger, config};
  })
  .then(param => {
    if (args.d === true || args["master-only"] === true) {
      /* eslint-disable no-console */
      console.log("starting single master process");
      /* eslint-enable no-console */
      startWorker(param.logger, param.config);
    } else {
      var numWorkers = args["workers"];
      fhcluster(function() {
        startWorker(param.logger, param.config);
      }, numWorkers);
    }
  })
  .catch(err => {
    /* eslint-disable no-console */
    console.error("error on startup ", err);
    /* eslint-enable no-console */
    process.exit(1);
  });
}

main();
