import assert from 'assert';
import listCollections from './list';
import {getLogger} from '../../../logger';

const logger = getLogger();

const COLLECTIONS = [{name: 'collection1'}, {name: 'collection2'}, {name: 'system.user'}];
const COLLECTION_STATS = [{name: 'collection1', ns:'test.collection1', count:5, size: 100},
                          {name: 'collection2', ns:'test.collection2', count: 10, size:200 },
                          {name: 'system.user', ns: 'system.user', count: 1, size: 10}];
const mock_db = {
  listCollections: function() {
    return mock_db;
  },
  toArray: function() {
    return Promise.resolve(COLLECTIONS);
  },
  collection: function(name) {
    return {
      stats: function() {
        const stat = COLLECTION_STATS.find( el => el.name === name);
        return Promise.resolve(stat);
      }
    };
  }
};

export function test_list_collections_impl(done) {
  listCollections('test-list-app', logger, mock_db).then(result => {
    assert.equal(result.length, 3, 'expect 3 items in the results');

    assert.equal(result[0].name, COLLECTION_STATS[0].name);
    assert.equal(result[0].count, COLLECTION_STATS[0].count);
    assert.equal(result[0].size, COLLECTION_STATS[0].size);

    assert.equal(result[1].name, COLLECTION_STATS[1].name);
    assert.equal(result[1].count, COLLECTION_STATS[1].count);
    assert.equal(result[1].size, COLLECTION_STATS[1].size);

    done();
  }).catch(done);
}