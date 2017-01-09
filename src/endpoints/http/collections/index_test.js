/* eslint-disable no-console */
import supertest from 'supertest';
import express from 'express';
import sinon from 'sinon';
import * as listImpl from './list';
import {collectionsHandler} from './index';
import {getLogger} from '../../../logger';

var app = express();
var router = express.Router();
var logger = getLogger();
collectionsHandler(router);
app.use((req, res, next) => {
  req.log = logger;
  next();
});
app.use('/api', router);

module.exports = {
  'test collection handlers': {
    'before': function(done) {
      sinon.stub(listImpl, 'default', function() {
        console.log('use mock listImpl');
        return Promise.resolve([{'ns':'test.test1', 'name':'test1', 'count': 1, 'size': 100}]);
      });
      done();
    },
    'after': function(done) {
      sinon.restore();
      done();
    },
    'test list handler': function(done) {
      supertest(app)
        .get('/api/collections')
        .expect(200)
        .end(done);
    }
  }
};