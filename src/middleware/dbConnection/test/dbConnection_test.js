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
function getMockReq() {
  return {
    params: {
      domain: '',
      envId: 101,
      appGuid: ''
    },
    db: '',
    log: {
      debug: function() {},
      info: function() {}
    }
  };
}
const ditch = {
  user: '',
  password: '',
  host: '',
  port: '',
  database: ''
};

export function establishDedicatedDbConnection(done) {
  const mockRes = new MyEmitter();
  const mockReq = getMockReq();

  mbaasClientStub.yields(null, {
    FH_MONGODB_CONN_URL: 'dedicatedconnection'
  });
  fhDbStub.resolves('dedicatedconnection');
  const underTest = middleware.default({
    mbaasConf: {},
    ditch: ditch
  });
  underTest(mockReq, mockRes, err => {
    assert.equal(mockReq.db, 'dedicatedconnection');
    assert.ok(!err);
    mockRes.emit('end');
    done();
  });
}

export function establishSharedDbConnection(done) {
  const mockRes = new MyEmitter();
  const mockReq = getMockReq();

  mbaasClientStub.yields(null, {});
  fhDbStub.resolves('sharedconnection');
  const underTest = middleware.default({
    mbaasConf: {},
    ditch: ditch,
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
  const mockRes = new MyEmitter();
  const mockReq = getMockReq();

  mbaasClientStub.yields({ditch: ditch}, null);
  const underTest = middleware.default({mbaasConf: {}, ditch: ditch});
  underTest(mockReq, mockRes, err => {
    assert.ok(err);
    mockRes.emit('end');
    done();
  });
}

export function errorEstablishingDbConnection(done) {
  const mockRes = new MyEmitter();
  const mockReq = getMockReq();

  mbaasClientStub.yields(null, {});
  fhDbStub.rejects('error');
  const underTest = middleware.default({mbaasConf: {}, ditch: ditch});
  underTest(mockReq, mockRes, err => {
    assert.ok(err);
    mockRes.emit('end');
    done();
  });
}

