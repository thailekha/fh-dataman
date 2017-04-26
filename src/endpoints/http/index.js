import {sysHealthEndpoint, sysPingEndpoint} from './sys';
import {collectionsHandler} from './collections';
import express from 'express';
import fhconfig from 'fh-config';
import dbConnection from '../../middleware/dbConnection';
import authorize from '../../middleware/route-authorize';
import parseFile from '../../middleware/parse-file';

const PATH_PREFIX = "/api/:domain/:envId/:appGuid/data";

function attachMiddlewares(router) {
  var collectionsEndpoint = router.route('/collections');
  collectionsEndpoint.get(authorize({permission: 'read'}));
  collectionsEndpoint.post(authorize({permission: 'write'}));
  collectionsEndpoint.delete(authorize({permission: 'write'}));

  var uploadEndpoint = router.route('/collections/upload');
  uploadEndpoint.post(authorize({permission: 'write'}), parseFile());

  var exportEndpoint = router.route('/collections/export');
  exportEndpoint.get(authorize({permission: 'read'}));

  const dbConfig = {
    mbaas: fhconfig.value('mbaas'),
    ditch: fhconfig.value('ditch')
  };
  router.use(dbConnection(dbConfig));
}

export default function buildEndpoints(server) {
  sysHealthEndpoint(server);
  sysPingEndpoint(server);

  var router = express.Router({mergeParams:true});
  attachMiddlewares(router);
  collectionsHandler(router);

  server.use(PATH_PREFIX, router);
}