import assert from 'assert';
import sinon from 'sinon';
import sinonStubPromise from 'sinon-stub-promise';
import EventEmitter from 'events';
import proxyquire from 'proxyquire';
import fs from 'fs';

import index from '../index';
import stream from 'stream';

sinonStubPromise(sinon); //synchronous

class MyEmitter extends EventEmitter {} //for mocking anything that emits events i.e. can be called `on('eventName', ...)` on

const middleware = proxyquire('../', {
  //overide import
  'busboy': MyEmitter
});

const expectedParsed = [ 
  { //_id: '589362430afa40f203d93cf8',
    name: 1,
    age: 19,
    status: 'P',
    likes: [ 'golf', 'racquetball' ] },
  { //_id: '5893626b0afa40f203d93cf9',
    name: 2,
    age: 32,
    status: 'P',
    likes: [ 'golf', 'racquetball' ] 
} ];

export function testFileBeingPutOnRequest(done) {
  const mockRes = {};
  const mockReq = {
    headers: {},
    pipe: function(busboy) {
      busboy.emit('file', 'test', fs.createReadStream('./fixture/import.json'), 'import.json', '7bit', 'application/json');
    }
  };
  const underTest = middleware.default();

  underTest(
    mockReq, mockRes, err => {
    assert.ok(mockReq.file);
    assert.ok(!err);
    done();
  });
}

export function testParserExtendedJson(done) {
  const mockRes = {};
  const mockReq = {
    headers: {},
    pipe: function(busboy) {
      busboy.emit('file', 'test', fs.createReadStream(__dirname + '/fixture/import.json'), 'import.json', '7bit', 'application/json');
    }
  };
  const parsed = [];
  const underTest = middleware.default();

  underTest(
    mockReq, mockRes, err => {
      mockReq.file
        .pipe(new BatchStream())
        .on('finish', () => {
          console.log('finish');
          done();
        });
      assert.ok(!err);
    });
}

export function testParserCsv(done) {
  const mockRes = {};
  const mockReq = {
    headers: {},
    pipe: function(busboy) {
      busboy.emit('file', 'test', fs.createReadStream(__dirname + '/fixture/import.csv'), 'import.csv', '7bit', 'text/csv');
    }
  };
  const parsed = [];
  const underTest = middleware.default();

  underTest(
    mockReq, mockRes, err => {
      mockReq.file.on('data', (chunk) => {
        delete chunk._id;
        parsed.push(chunk);
        if(parsed.length === 2) {
          assert.deepEqual(expectedParsed, parsed);
          done();
        }
      });
      assert.ok(!err);
    });
}

export function testParserBson(done) {
  const mockRes = {};
  const mockReq = {
    headers: {},
    pipe: function(busboy) {
      busboy.emit('file', 'test', fs.createReadStream(__dirname + '/fixture/import.bson'), 'import.bson', '7bit', 'application/octet-stream');
    }
  };
  const parsed = [];
  const underTest = middleware.default();

  underTest(
    mockReq, mockRes, err => {
    mockReq.file.on('data', (chunk) => {
      delete chunk._id;
      parsed.push(chunk);

      if(parsed.length === 2) {
        assert.deepEqual(expectedParsed, parsed);
        done();
      }
    });
    assert.ok(!err);
  });
}

export function testBusboyError(done) {
  const mockRes = {};
  const mockReq = {
    headers: {},
    pipe: function(busboy) {
      busboy.emit('error', new Error('test error'));
    }
  };
  const underTest = middleware.default();

  underTest(
    mockReq, mockRes, err => {
    assert.ok(!mockReq.file);
    assert.equal(err.message,'test error');
    done();
  });
}