import assert from 'assert';
import sinon from 'sinon';
import fs from 'fs';
import stream from 'stream';
import { InsertStream } from  '../';


/*comment this */
class TransformToObject extends stream.Transform {
  constructor() {
    super({objectMode:true});
  }

  _transform(data, encoding, cb) {
    data.split('\n')
      .filter(line => line.length)
      .forEach(line => this.push(JSON.parse(line)));

    cb();
  }
}

function getOption(opts) {
  const insertSpy = sinon.spy();
  const insertManySpy = sinon.spy();
  const collection = {
    insert(data, cb) {
      insertSpy(data);
      cb();
    },
    insertMany(data, cb) {
      insertManySpy(data);
      cb();
    }
  };

  return {
    insertSpy: insertSpy,
    insertManySpy: insertManySpy,
    highWaterMark: opts.highWaterMark,
    collectionName: 'test-collection',
    db: {
      collection: function(name, cb) {
        cb(opts.err, collection);
      }
    }
  };
}

function createTestStream(highWaterMark, err, cb) {
  const option = getOption({highWaterMark, err});
  const stream = fs.createReadStream(`${__dirname}/data.json`, {encoding: 'utf8'})
  .pipe(new TransformToObject())
  .pipe(new InsertStream(option));

  cb(stream, option);
}

export function testSingleWrite(done) {

  createTestStream(1, null, (stream, option) => {
    stream.on('finish', () => {
      assert.ok(option.insertSpy.calledThrice);
      assert.ok(option.insertManySpy.notCalled);
      done();
    });
  });

}

export function testBatchWrite(done) {

  createTestStream(2, null, (stream, option) => {
    stream.on('finish', () => {
      assert.ok(option.insertSpy.calledOnce);
      assert.ok(option.insertManySpy.calledOnce);
      assert.equal(option.insertManySpy.getCall(0).args[0].length, 2);
      done();
    });
  });

}

export function testError(done) {

  createTestStream(1, {}, stream => {
    stream.on('error', () => {
      assert.ok(true);
      done();
    });
  });

}

export function testMaxWrite(done) {

  createTestStream(2000, null, stream => {
    assert.ok(stream._writableState.highWaterMark === 1000);
    done();
  });

}
