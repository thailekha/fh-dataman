import assert from 'assert';
import createCollection from './create';
import sinon from 'sinon';
import {getLogger} from '../../../logger';

const logger = getLogger();
const createCollectionStub = sinon.stub();

const mockDb = {
  createCollection: createCollectionStub
};

export function testCreateCollection(done) {
  createCollectionStub.returns(true);
  assert.equal(createCollection('test-create-collection', logger, mockDb, 'testCollection'), true);
  done();
}

export function testCreateCollectionFailure(done) {
  createCollectionStub.returns(false);
  assert.equal(createCollection('test-create-collection', logger, mockDb, 'testCollection'), false);
  done();
}