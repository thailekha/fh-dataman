//this is for testing only. Should be replaced once the real code is ready
import fhdb from 'fh-db';
import request from 'request';

function getAppDbUrl(options, cb) {
  var mbaas_url = options.mbaas.url;
  request({method: 'GET', url: mbaas_url, json: true}, (err, response, body) => {
    if (err) {
      return cb(err);
    }
    return cb(null, body);
  });
}

export default function dbConnection(options) {
  return function(req, res, next) {
    getAppDbUrl(options, (err, result) => {
      if (err) {
        return next(err);
      }
      fhdb.createMongoCompatApi({
        __dbperapp: true,
        connectionUrl: result.db
      }).then(db => {
        req.db = db;
        next();
      }).catch(next);
    });
  };
}