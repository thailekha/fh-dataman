import assert from 'assert';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import mockMbaasClient from './mocks/fhMbaasClientMock';

const mbaasClientStub = sinon.stub();
const fhDbStub = sinon.stub();
const middleware = proxyquire('../', {
  'fh-mbaas-client': {
    MbaasClient: mockMbaasClient(mbaasClientStub)
  },
  'fh-db': {
    createMongoCompatApi: fhDbStub
  }
});


describe('Database Connection Middleware', () => {
  const mockRes = {};

  afterEach(done => {
    sinon.restore();
    done();
  });

  it('should establish dedicated db connection when mongo url available in app environment variables', done => {
    const mockReq = {envId: 101, db: ''};
    mbaasClientStub.yields(null, {
      FH_MONGODB_CONN_URL: 'dedicatedconnection'
    });
    fhDbStub.yields(null, 'dedicatedconnection');
    const underTest = middleware.default({mbaasConf: {}});
    underTest(mockReq, mockRes, err => {
      assert.equal(mockReq.db, 'dedicatedconnection');
      assert.ok(!err);
      done();
    });
  });

  it('should establish shared db connection when mongo url available in mbaas config', done => {
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
      done();
    });
  });

  it('should throw mbaas configuration required error', done => {
    assert.throws(function() {
      middleware.default({});
    }, Error, 'mbaas configuration required');
    done();
  });

  it('should throw missing required params error when attempting to get app env vars', done => {
    const mockReq = {};
    mbaasClientStub.yields( {}, null);
    const underTest = middleware.default({mbaasConf: {}});
    underTest(mockReq, mockRes, err => {
      assert.ok(err);
      done();
    });
  });

  it('should throw error when attempting to resolve mongo handle', done => {
    const mockReq = {};
    mbaasClientStub.yields(null, {});
    fhDbStub.yields({}, null);
    const underTest = middleware.default({mbaasConf: {}});
    underTest(mockReq, mockRes, err => {
      assert.ok(err);
      done();
    });
  });
});