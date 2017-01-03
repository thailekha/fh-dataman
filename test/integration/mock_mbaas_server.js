/* eslint-disable no-console */
/**
 * Mock mbaas service for testing
 */
import express from 'express';
import * as mongodbClient from './mongodb_client';

var app = express();
//TODO: change the path here to be the right one
app.get('/', function(req, res) {
  console.log('returning mock mongdb url', mongodbClient.MONGODBURL);
  return res.json({db: mongodbClient.MONGODBURL});
});

var server;
export function start(port, cb) {
  console.log(`start the mock mbaas server with port ${port}`);
  server = app.listen(port, cb);
}

export function stop(cb) {
  if (server) {
    console.log('stop mock mbaas server');
    server.close(cb);
  } else {
    return cb();
  }
}