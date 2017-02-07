import assert from 'assert';
import sinon from 'sinon';
import fs from 'fs';
import stream from 'stream';
import { InsertStream } from  '../index';


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
  return {
    insertSpy: insertSpy,
    insertManySpy: insertManySpy,
    highWaterMark: opts.highWaterMark,
    db: {
      collection: function() {
        return {
          insert(data,cb) {
            insertSpy(data);
            cb();
          },
          insertMany(data,cb) {
            insertManySpy(data);
            cb();
          }
        };
      }
    }
  };
}

function createTestStream(highWaterMark, cb) {
  const option = getOption({highWaterMark: highWaterMark});
  fs.createReadStream(`${__dirname}/import.json`, {encoding: 'utf8'})
  .pipe(new TransformToObject())
  .pipe(new InsertStream(option))
  .on('finish', () => cb(option));
}

export function testSingleWrite(done) {

  createTestStream(1, option => {
    assert.ok(option.insertSpy.calledThrice);
    assert.ok(option.insertManySpy.notCalled);
    done();
  });

}

export function testBatchWrite(done) {

  createTestStream(2, option => {
    assert.ok(option.insertSpy.calledOnce);
    assert.ok(option.insertManySpy.calledOnce);
    assert.equal(option.insertManySpy.getCall(0).args[0].length, 2);
    done();
  });

}
