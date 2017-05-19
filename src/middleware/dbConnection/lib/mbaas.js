import fhMbaasClient from 'fh-mbaas-client';
import async from 'async';

function getMbaasClient(options, req, cb) {
  const mbaasClient = new fhMbaasClient.MbaasClient(req.params.envId, options.mbaas);
  cb(null, {mbaasClient});
}

function getAppEnvVars(req, result, cb) {
  const {domain, envId, appGuid} = req.params;
  const appname = `${domain}-${appGuid}-${envId}`;
  result.appname = appname;
  const appId = {domain, environment: envId, appname};
  result.mbaasClient.admin.apps.envVars.get(appId, (err, resp) => {
    if (err) {
      return cb(err);
    }

    result.appEnvVars = resp.env;
    req.log.debug({appEnvVars: result.appEnvVars}, 'got env vars');
    cb(null, result);
  });
}

function getMongoOptions(options, result, cb) {
  const mongoOptions = {};
  const appEnvVars = result.appEnvVars;
  mongoOptions.isDedicatedDb = !!(appEnvVars && appEnvVars.FH_MONGODB_CONN_URL);
  if (mongoOptions.isDedicatedDb) {
    mongoOptions.primaryNodeUrl = appEnvVars.FH_MONGODB_CONN_URL;
  } else {
    mongoOptions.host = options.ditch.host;
    mongoOptions.port = options.ditch.port;
  }

  result.mongoOptions = mongoOptions;
  cb(null, result);
}

function getMongoPrimaryNode(options, result, cb) {
  if (result.mongoOptions.isDedicatedDb) {
    return cb(null, result);
  }

  result.mbaasClient.storage.master(result.mongoOptions, function(err, mongoPrimary) {
    if (err) {
      return cb(err);
    }

    const {user, password, database} = options.ditch;
    result.mongoOptions.primaryNodeUrl = `mongodb://${user}:${password}@${mongoPrimary.host}:${mongoPrimary.port}/${database}`;

    cb(null, result);
  });
}

function createMongoConnectionParams(result, cb) {
  result.connectionParams = {
    __dbperapp: result.mongoOptions.isDedicatedDb,
    connectionUrl: result.mongoOptions.primaryNodeUrl,
    __fhdb: result.appname
  };
  cb(null, result);
}

/**
 * @param {object} options
 */
export default {
  getMongoConf: function(options, req) {
    return new Promise((resolve, reject) => {
      async.waterfall([
        async.apply(getMbaasClient, options, req),
        async.apply(getAppEnvVars, req),
        async.apply(getMongoOptions, options),
        async.apply(getMongoPrimaryNode, options),
        createMongoConnectionParams
      ],
      (err, result) => {
        if (err) {
          return reject(err);
        }

        resolve(result.connectionParams);
      });
    });
  }
};
