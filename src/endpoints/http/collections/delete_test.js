import assert from 'assert';
import deleteCollections from './delete';
import sinon from 'sinon';
import {getLogger} from '../../../logger';
import sinonStubPromise from 'sinon-stub-promise';

sinonStubPromise(sinon);
const logger = getLogger();
const listStub = sinon.stub().returnsPromise();
const dropStub = sinon.stub();
const dropFailStub = sinon.stub();

dropStub.onFirstCall().returns(new Promise(resolve => {
  resolve({name: 'testCollection'});
}));

dropStub.onSecondCall().returns(new Promise(resolve => {
  resolve({name: 'collection1'});
}));

const mockDb = {
  dropCollection: dropStub,
  listCollections: function() {
    return {
      toArray: listStub
    };
  }
};

const mockReqCollections = ['testCollection', 'collection1'];

export function testDeleteCollections(done) {
  listStub.resolves([{name: 'testCollection'}, {name: 'collection1'}, {name: 'collection2'}]);
  deleteCollections('test-delete-app', logger, mockDb, mockReqCollections).then(collections => {
    assert.deepEqual(collections, [{name: 'testCollection'}, {name: 'collection1'}]);
    done();
  });
}

export function testDeleteCollectionsFailure(done) {
  listStub.resolves([{name: 'testCollection'}, {name: 'collection1'}, {name: 'collection2'}]);
  dropFailStub.returns(new Promise((resolve, reject) => {
    reject(new Error('error'));
  }));
  mockDb.dropCollection = dropFailStub;
  deleteCollections('test-delete-app', logger, mockDb, mockReqCollections).catch(err => {
    assert.ok(err);
    done();
  });
}