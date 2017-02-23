import assert from 'assert';
import EventEmitter from 'events';
import proxyquire from 'proxyquire';
import fs from 'fs';

const parseFile = proxyquire('../', {
  'busboy': EventEmitter
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
    pipe: function(busboy) {
      busboy.emit('file', 'test', fs.createReadStream('./fixture/import.json'), 'import.json', '7bit', 'application/json');
    }
  };
  const middleware = parseFile.default();

  middleware(mockReq, mockRes, err => {
    assert.ok(!err);

    assert.ok(mockReq.file);
    assert.ok(mockReq.file.meta);
    assert.equal(mockReq.file.meta.fileName, 'import.json');
    assert.equal(mockReq.file.meta.encoding, '7bit');
    assert.equal(mockReq.file.meta.mimetype, 'application/json');
    done();
  });
}

export function testError(done) {
  const mockRes = {};
  const mockReq = {
    headers: {},
    pipe: function(busboy) {
      busboy.emit('error', new Error('test error'));
    }
  };
  const middleware = parseFile.default();

  middleware(mockReq, mockRes, err => {
    assert.ok(!mockReq.file);
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
      pipe: function(busboy) {
        busboy.emit('file', 'test', fs.createReadStream(`${__dirname}/fixture/import.${parser.ext}`), `import.${parser.ext}`, '7bit', parser.mimeType);
      }
    };

    const middleware = parseFile.default();

    middleware(mockReq, mockRes, err => {
      assert.ok(!err);

      mockReq.file.on('data', obj => {
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
