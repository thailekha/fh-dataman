import supertest from 'supertest';
import express from 'express';
import {sysPingEndpoint, sysHealthEndpoint} from './sys.js';
import statusCodes from '../statusCodes';

const app = express();

export function testSysPing(done) {
  sysPingEndpoint(app);
  supertest(app)
    .get('/sys/info/ping')
    .expect(statusCodes.SUCCESS)
    .end(done);
}

export function testSysHealth(done) {
  sysHealthEndpoint(app);
  supertest(app)
    .get('/sys/info/health')
    .expect(statusCodes.SUCCESS)
    .end(done);
}
