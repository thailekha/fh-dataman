import listCollections from './list';
import createCollection from './create';
import deleteCollections from './delete';
import {insertCollections, getCollectionName} from './files';
import parseFile from '../../../middleware/parse-file';
import statusCodes from '../../statusCodes';
import authorize from '../../../middleware/route-authorize';

const DUPLICATE_DOCUMENT_ID = 11000;
const BATCHSTREAM_RECEIVED_BUFFER = 22000;

export function collectionsHandler(router) {
  //list collection info
  router.get('/collections', authorize({permission: 'read'}), function(req, res, next) {
    var appGuid = req.params.appGuid;
    req.log.debug({app: appGuid}, 'listing collections for app');
    listCollections(req.param('appGuid'), req.log, req.db)
      .then(result => {
        req.log.trace({app: appGuid, result}, 'collection data listed');
        res.json(result);
      })
      .catch(next);
  });

  //create collection
  router.post('/collections', authorize({permission: 'write'}), (req, res, next) => {
    if (!req.body.name) {
      return next({'message': 'name is required', code: statusCodes.BAD_REQUEST});
    }
    const name = req.body.name;
    createCollection(req.params.appGuid, req.log, req.db, name)
      .then(() => {
        req.log.trace({name}, 'collection created');
        return res.status(statusCodes.CREATED).send(name.concat(' collection created'));
      }).catch(next);
  });

  // Delete collection
  router.delete('/collections/', authorize({permission: 'write'}), (req, res, next) => {
    if (!req.query.names) {
      return next({'message': 'names(s) of collection(s) is required', code: statusCodes.BAD_REQUEST});
    }

    const reqCollections = req.query.names.split(',');
    deleteCollections(req.params.appGuid, req.log, req.db, reqCollections)
      .then(function(collections) {
        if (!collections.length) {
          return next({'message': 'collection(s) requested do not exist', code: statusCodes.BAD_REQUEST});
        }

        const names = collections.map(function(object) {
          return object.name;
        });
        req.log.trace({app: req.params.appGuid, names}, 'collection(s) deleted');
        return res.status(statusCodes.SUCCESS).send(names.toString().concat(' collection(s) deleted'));
      })
      .catch(next);
  });

  // Upload collections from files
  router.post('/collections/upload', parseFile(), authorize({permission: 'write'}), (req, res, next) => {
    if (!req.files.length) {
      return next({message: 'No file', code: statusCodes.BAD_REQUEST});
    }

    req.log.debug(req.files.map(file => getCollectionName(file.meta.fileName)), 'Starting collections upload');

    insertCollections(req.files, req.db)
      .then(importedCollections => {
        req.log.trace({importedCollections}, 'Collections upload completed');
        res.status(statusCodes.CREATED).end();
      })
      .catch(err => {
        if (err.code === BATCHSTREAM_RECEIVED_BUFFER) {
          err.message = `File ${err.fileName} unsupported`;
          err.code = statusCodes.UNSUPPORTED_MEDIA;
        }

        if (err.code !== statusCodes.CONFLICT) {
          deleteCollections(req.params.appGuid, req.log, req.db, [err.collectionName]);
        }

        if (err.code === DUPLICATE_DOCUMENT_ID) {
          err.code = statusCodes.CONFLICT;
        }

        next(err);
      });
  });
}
