import supertest from 'supertest';
import assert from 'assert';
import express from 'express';
import authorize from '../';

const testRouteAuthorized = '/test/endpoint/authorized';
const testRouteForbiddenPermission = '/test/endpoint/forbidden/permission';
const testRouteForbiddenAccess = '/test/endpoint/forbidden/access';

authorize.config = {
  globalPermissionPath: 'user.permission',
  globalAccessPrefix: 'user.access.',
  globalRoutePermission: 'correctPermission',
  routePermissions: {
    '/test/endpoint/forbidden/permission': 'incorrectPermission'
  }
};

var user = {
  access: {
    read: true,
    appLevelAccess: true
  },
  permission: 'correctPermission'
};

const app = express();

app.use((req, res, next) => {
  req.user = user;

  next();
});

app.use(authorize({accessPath: 'user.access.appLevelAccess', permissionPath: 'user.permission'}));

function responseHandler(req, res) {
  res.status(200).end();
}

app.get('/', responseHandler);

app.get(testRouteAuthorized, authorize({access: 'read'}), responseHandler);
app.get(testRouteForbiddenPermission, authorize({access: 'read'}), responseHandler);
app.get(testRouteForbiddenAccess, authorize({access: 'write'}), responseHandler);

app.use((err, req, res, next) => {
  if (err) {
    return res.status(err.code).send({ message: err.message });
  }

  return res.status(200).end();
});

export function routeShouldPassAuthorization(done) {
  supertest(app)
    .get(testRouteAuthorized)
    .expect(200)
    .end(err => {
      done(err);
    });
}

export function routeShouldFailAuthorizationForPermission(done) {
  supertest(app)
    .get(testRouteForbiddenPermission)
    .expect(403)
    .expect(res => {
      assert.equal(res.body.message, 'Incorrect permission');
    })
    .end(err => {
      done(err);
    });
}

export function routeShouldFailAuthorizationForAccess(done) {
  supertest(app)
    .get(testRouteForbiddenAccess)
    .expect(403)
    .expect(res => {
      assert.equal(res.body.message, 'Incorrect access');
    })
    .end(err => {
      done(err);
    });
}

export function routeShouldFailAuthorizationAtAppLevel(done) {
  user.access.appLevelAccess = false;
  supertest(app)
    .get(testRouteAuthorized)
    .expect(403)
    .expect(res => {
      assert.equal(res.body.message, 'Incorrect access');
    })
    .end(err => {
      user.access.appLevelAccess = true;

      done(err);
    });
}
