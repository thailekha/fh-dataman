import assert from 'assert';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import mockMbaasClient from './mocks/fhMbaasClientMock';
import EventEmitter from 'events';

const mbaasClientStub = sinon.stub();
const fhDbStub = sinon.stub();
class MyEmitter extends EventEmitter {}
const middleware = proxyquire('../', {
  'fh-mbaas-client': {
    MbaasClient: mockMbaasClient(mbaasClientStub)
  },
  'fh-db': {
    createMongoCompatApi: fhDbStub
  }
});

export function establishDedicatedDbConnection(done) {
  const mockRes = new MyEmitter();
  const mockReq = {envId: 101, db: ''};
  mbaasClientStub.yields(null, {
    FH_MONGODB_CONN_URL: 'dedicatedconnection'
  });
  fhDbStub.yields(null, 'dedicatedconnection');
  const underTest = middleware.default({mbaasConf: {}});
  underTest(mockReq, mockRes, err => {
    assert.equal(mockReq.db, 'dedicatedconnection');
    assert.ok(!err);
    mockRes.emit('end');
    done();
  });
}

export function establishSharedDbConnection(done) {
  const mockRes = new MyEmitter();
  const mockReq = {envId: 102, db: ''};
  mbaasClientStub.yields( null, {});
  fhDbStub.yields(null, 'sharedconnection');
  const underTest = middleware.default({
    mbaasConf: {},
    FH_MONGODB_CONN_URL: 'sharedconnection'
  });
  underTest(mockReq, mockRes, err => {
    assert.equal(mockReq.db, 'sharedconnection');
    assert.ok(!err);
    mockRes.emit('end');
    done();
  });
}

export function mbaasConfigRequired(done) {
  const mockRes = new MyEmitter();
  assert.throws(function() {
    middleware.default({});
  }, Error, 'mbaas configuration required');
  mockRes.emit('end');
  done();
}

export function missingMbaasClientParams(done) {
  const mockReq = {};
  const mockRes = new MyEmitter();
  mbaasClientStub.yields( {}, null);
  const underTest = middleware.default({mbaasConf: {}});
  underTest(mockReq, mockRes, err => {
    assert.ok(err);
    mockRes.emit('end');
    done();
  });
}

export function errorEstablishingDbConnection(done) {
  const mockReq = {};
  const mockRes = new MyEmitter();
  mbaasClientStub.yields(null, {});
  fhDbStub.yields({}, null);
  const underTest = middleware.default({mbaasConf: {}});
  underTest(mockReq, mockRes, err => {
    assert.ok(err);
    mockRes.emit('end');
    done();
  });
}

