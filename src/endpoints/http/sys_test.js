import supertest from 'supertest';
import express from 'express';
import {sysPingEndpoint, sysHealthEndpoint} from './sys.js';

const app = express();

export function testSysPing(done) {
  sysPingEndpoint(app);
  supertest(app).get('/sys/info/ping').expect(200).end(done);
}

export function testSysHealth(done) {
  sysHealthEndpoint(app);
  supertest(app).get('/sys/info/health').expect(200).end(done);
}
