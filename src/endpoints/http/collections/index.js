import listCollections from './list';
import {createCollection} from './create';
import authorize from '../../../middleware/route-authorize';

export function collectionsHandler(router) {
  //list collection info
  router.get('/collections', authorize({access: 'read'}), function(req, res, next) {
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
  createCollection(router);
}
