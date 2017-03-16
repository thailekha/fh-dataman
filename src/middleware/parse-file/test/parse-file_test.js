import assert from 'assert';
import EventEmitter from 'events';
import fs from 'fs';

const proxyquire = require('proxyquire').noCallThru();

const parseFile = proxyquire('../', {
  './BusboyZip': EventEmitter
});

const parserInfo = [
  {ext: 'csv', mimeType: 'text/csv'},
  {ext: 'json', mimeType: 'application/json'},
  {ext: 'bson', mimeType: 'application/octet-stream'},
  null
];

function getExpected() {
  return [
    {
      _id: '589362430afa40f203d93cf8',
      name: '1',
      age: 19,
      status: 'P',
      likes: [ 'golf', 'racquetball' ] },
    {
      _id: '5893626b0afa40f203d93cf9',
      name: '2',
      age: 32,
      status: 'P',
      likes: [ 'golf', 'racquetball' ]
    },
    {
      _id: '589362830afa40f203d93cfa',
      name: '3',
      age: 32,
      status: 'P',
      likes: [ 'golf', 'racquetball' ]
    }
  ];
}

export function testFileOnRequest(done) {
  const mockRes = {};
  const mockReq = {
    headers: {},
    pipe: function(busboyZip) {
      busboyZip.emit('file', 'test', fs.createReadStream(`${__dirname}/fixture/import.json`), 'import.json', '7bit', 'application/json');
      process.nextTick(() => busboyZip.emit('finish'));
    }
  };
  const middleware = parseFile.default();

  middleware(mockReq, mockRes, err => {
    assert.ok(!err);

    const file = mockReq.files[0];
    assert.ok(file);
    assert.ok(file.meta);
    assert.equal(file.meta.fileName, 'import.json');
    assert.equal(file.meta.encoding, '7bit');
    assert.equal(file.meta.mimetype, 'application/json');
    done();
  });
}

export function testError(done) {
  const mockRes = {};
  const mockReq = {
    headers: {},
    pipe: function(busboyZip) {
      busboyZip.emit('error', new Error('test error'));
    }
  };
  const middleware = parseFile.default();

  middleware(mockReq, mockRes, err => {
    assert.ok(!mockReq.files[0]);
    assert.equal(err.message,'test error');
    done();
  });
}

export function testParsers(done) {
  parserInfo.forEach(parser => {
    if (!parser) {
      return done();
    }

    const expected = getExpected();
    const mockRes = {};
    const mockReq = {
      headers: {},
      pipe: function(busboyZip) {
        busboyZip.emit('file', 'test', fs.createReadStream(`${__dirname}/fixture/import.${parser.ext}`), `import.${parser.ext}`, '7bit', parser.mimeType);
      }
    };

    const middleware = parseFile.default();

    middleware(mockReq, mockRes, err => {
      assert.ok(!err);

      mockReq.files[0].on('data', obj => {
        const expectedObj = expected.shift();
        Object.keys(expectedObj)
          .forEach(key => {
            if (key === '_id') {
              return assert.equal(expectedObj[key].toString(), obj[key].toString());
            }

            assert.deepEqual(expectedObj[key], obj[key]);
          });
      });
    });
  });
}
