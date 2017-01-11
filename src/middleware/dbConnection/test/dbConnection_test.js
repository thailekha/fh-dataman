import assert from 'assert';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import sinonStubPromise from 'sinon-stub-promise';
import mockMbaasClient from './mocks/fhMbaasClientMock';
import EventEmitter from 'events';

sinonStubPromise(sinon);
const mbaasClientStub = sinon.stub();
const fhDbStub = sinon.stub().returnsPromise();
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
  const mockReq = {
    envId: 101,
    db: '',
    log: {
      debug: function() {},
      info: function() {}
    }
  };
  mbaasClientStub.yields(null, {
    FH_MONGODB_CONN_URL: 'dedicatedconnection'
  });
  fhDbStub.resolves('dedicatedconnection');
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
  const mockReq = {
    envId: 102,
    db: '',
    log: {
      debug: function() {},
      info: function() {}
    }
  };
  mbaasClientStub.yields(null, {});
  fhDbStub.resolves('sharedconnection');
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

export function missingMbaasClientParams(done) {
  const mockReq = {
    log: {
      debug: function() {},
      info: function() {}
    }
  };
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
  const mockReq = {
    log: {
      debug: function() {},
      info: function() {}
    }
  };
  const mockRes = new MyEmitter();
  mbaasClientStub.yields(null, {});
  fhDbStub.rejects('error');
  const underTest = middleware.default({mbaasConf: {}});
  underTest(mockReq, mockRes, err => {
    assert.ok(err);
    mockRes.emit('end');
    done();
  });
}

