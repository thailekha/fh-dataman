import fhMbaasClient from 'fh-mbaas-client';
import fhdb from 'fh-db';

/**
 * @param {object} options
 */
export default options => {

  /**
   * Middleware to establish the database connection for a given app.
   *
   * @param {Object} req
   * @param {Object} res
   * @param {object} next
   */

  function middleware(req, res, next) {
    const {domain, envId, appGuid} = req.params;
    const appname = `${domain}-${appGuid}-${envId}`;
    const {user, password, host, port, database} = options.ditch;

    const client = new fhMbaasClient.MbaasClient(envId, options.mbaas);
    client.admin.apps.envVars.get({ // Get the app's environment variables by calling on fh-mbaas-client
      domain: domain,
      environment: envId,
      appname: appname
    }, function(err, resp) {
      if (err) {
        return next(err);
      }

      const appEnvVars = resp.env;
      req.log.debug({appEnvVars}, 'got env vars');
      const isDedicatedDb = !!(appEnvVars && appEnvVars.FH_MONGODB_CONN_URL);
      const params = {
        __dbperapp: isDedicatedDb, // True for dedicated db and false for shared db
        connectionUrl: isDedicatedDb ? appEnvVars.FH_MONGODB_CONN_URL : `mongodb://${user}:${password}@${host}:${port}/${database}`,
        __fhdb: appname
      };
      fhdb.createMongoCompatApi(params).then(db => {
        req.log.info({db: db}, 'mongodb connection set');
        req.db = db;
        next();
      }).catch(next);
    });
    res.once('end', () => { // Close db connection once 'end' event is emitted
      if (req.db) {
        req.db.close();
      }
    });
  }
  return middleware;
};
