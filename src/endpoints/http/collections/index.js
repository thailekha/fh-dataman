import listCollections from './list';
import createCollection from './create';
import deleteCollections from './delete';

export function collectionsHandler(router) {
  //list collection info
  router.get('/collections', function(req, res, next) {
    var appname = req.param('appname');
    req.log.debug({app: appname}, 'listing collections for app');
    listCollections(req.param('appname'), req.log, req.db)
      .then(result => {
        req.log.trace({app: appname, result}, 'collection data listed');
        res.json(result);
      })
      .catch(next);
  });

  //create collection
  router.post('/collections', (req, res, next) => {
    if (!req.body.name) {
      return next({'message': 'name is required', code: 400});
    }
    const name = req.body.name;
    createCollection(req.param('appname'), req.log, req.db, name)
      .then(() => {
        req.log.trace({name}, 'collection created');
        return res.status(201).send(name.concat(' collection created'));
      }).catch(next);
  });

  // Delete collection
  router.delete('/collections/', (req, res, next) => {
    if (!req.query.names) {
      return next({'message': 'names(s) of collection(s) is required', code: 400});
    }

    const reqCollections = req.query.names.split(',');
    deleteCollections(req.param('appname'), req.log, req.db, reqCollections)
      .then(function(collections) {
        if (!collections.length) {
          return next({'message': 'collection(s) requested do not exist', code: 400});
        }

        const names = collections.map(function(object) {
          return object.name;
        });
        const appname = req.param('appname');
        req.log.trace({app: appname, names}, 'collection(s) deleted');
        return res.status(200).send(names.toString().concat(' collection(s) deleted'));
      })
      .catch(next);
  });
}