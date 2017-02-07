import {sysHealthEndpoint, sysPingEndpoint} from './sys';
import {collectionsHandler} from './collections';
import express from 'express';

const PATH_PREFIX = "/api/:domain/:envId/:appGuid/data";

export default function buildEndpoints(server) {
  sysHealthEndpoint(server);
  sysPingEndpoint(server);

  var router = express.Router();
  collectionsHandler(router);
  server.use(PATH_PREFIX, router);
}
