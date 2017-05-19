import mbaas from './lib/mbaas';
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

    res.once('end', () => req.db && req.db.close());

    mbaas.getMongoConf(options, req)
      .then(conf => fhdb.createMongoCompatApi(conf))
      .then(db => req.db = db)
      .then(db => req.log.info({db: db}, 'mongodb connection set'))
      .then(next)
      .catch(next);
  }

  return middleware;
};
