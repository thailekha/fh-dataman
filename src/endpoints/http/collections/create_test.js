import supertest from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import {createCollection} from './create.js';
import authorize from '../../../middleware/route-authorize';

authorize.config = {
  globalPermissionPath: 'user.permission',
  globalAccessPrefix: 'user.access.',
  globalRoutePermission: 'correctPermission'
};

const collectionEndPoint = '/collections';
const app = express();
app.use(bodyParser.json());
app.use((req, res, next) => {
  req.db = {
    createCollection: (name, cb) => {
      if (name === 'fail') {
        return cb(new Error('db error'));
      }

      cb();
    }
  };

  req.log = {
    debug: function() {},
    trace: function() {}
  };

  req.user = {
    access: {
      write: true
    },
    permission: 'correctPermission'
  };

  next();
});

export function testNameParamRequired(done) {
  createCollection(app);

  supertest(app)
    .post(collectionEndPoint)
    .expect(400)
    .expect(res => {
      res.message = 'name is required';
    })
    .end(done);
}

export function dbError(done) {
  createCollection(app);

  supertest(app)
    .post(collectionEndPoint)
    .send({ name: 'fail' })
    .expect(500)
    .expect(res => {
      res.message = 'db error';
    })
    .end(done);
}

export function testCreateCollectionSuccess(done) {
  createCollection(app);

  supertest(app)
    .post(collectionEndPoint)
    .send({ name: 'success' })
    .expect(201)
    .end(done);
}
