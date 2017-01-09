import fhMbaasClient from 'fh-mbaas-client';
import fhdb from 'fh-db';

  /**
   * @param {object} options
   */
export default options => {

  if (!options.mbaasConf) {
    throw new Error('mbaas configuration required');
  }

  /**
   * Middleware to establish the database connection for a given app.
   *
   * @param {Object} req
   * @param {Object} res
   * @param {object} next
   */
  function middleware(req, res, next) {
    const client = new fhMbaasClient.MbaasClient(req.envId, options.mbaasConf);
    client.admin.apps.envVars.get({ // Get the app's environment variables by calling on fh-mbaas-client
      domain: req.domain || {},
      environment: req.envId,
      appname: req.appname || {}
    }, function(err, resp) {
      if (err) {
        next(err);
      } else {
        const appEnvVars = resp;
        let dbparams = {};
        if (appEnvVars && appEnvVars.FH_MONGODB_CONN_URL) {
          dbparams = {
            __dbperapp: true, // true when using dedicated db.
            connectionUrl: appEnvVars.FH_MONGODB_CONN_URL
          };
        } else {
          dbparams = {
            __dbperapp: false, // false when using shared db.
            connectionUrl: options.FH_MONGODB_CONN_URL
          };
        }
        fhdb.createMongoCompatApi(dbparams, function(err, resp) { // create connection to db, resolve mongo handle and attaches url to req object
          if (err) {
            next(err);
          } else {
            req.db = resp;
            next();
          }
        });
      }
    });
    res.once('end', () => {
      if (req.db) {
        req.db.close();
      }
    });
  }
  return middleware;
};