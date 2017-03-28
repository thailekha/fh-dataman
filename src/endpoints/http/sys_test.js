import supertest from 'supertest';
import express from 'express';
import {sysPingEndpoint, sysHealthEndpoint} from './sys.js';
import statusCodes from 'http-status-codes';

const app = express();

export function testSysPing(done) {
  sysPingEndpoint(app);
  supertest(app)
    .get('/sys/info/ping')
    .expect(statusCodes.OK)
    .end(done);
}

export function testSysHealth(done) {
  sysHealthEndpoint(app);
  supertest(app)
    .get('/sys/info/health')
    .expect(statusCodes.OK)
    .end(done);
}
