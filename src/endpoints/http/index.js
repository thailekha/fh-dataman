import {sysHealthEndpoint, sysPingEndpoint} from './sys';
import {collectionsHandler} from './collections';
import express from 'express';
import dbConnectionMiddleware from '../../middleware/db-connection';
import fhconfig from 'fh-config';

const PATH_PREFIX = "/api/:domain/:envId/:appGuid/data";

export default function buildEndpoints(server) {
  sysHealthEndpoint(server);
  sysPingEndpoint(server);

  var router = express.Router();
  router.use(dbConnectionMiddleware({mbaas: fhconfig.value('mbaas')}));
  collectionsHandler(router);
  server.use(PATH_PREFIX, router);
}