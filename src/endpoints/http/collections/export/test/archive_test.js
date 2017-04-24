import archive from '../lib/archive';
import fs from 'fs';
import assert from 'assert';
import concat from 'concat-stream';
import yauzl from 'yauzl';

export function testArchiveSuccess(done) {
  const collections = [];
  const collection = fs.createReadStream(`${__dirname}/export.json`);
  collection.filename = 'testCollection';
  collections.push(collection);
  const readStream = archive(collections);

  readStream.pipe(concat(buffer => {
    yauzl.fromBuffer(buffer, (err, zip) => {
      if (err) {
        return done(err);
      }

      const entries = [];
      zip.on('entry', entry => {
        entries.push(entry);
      });
      zip.on('end', () => {
        assert.equal(entries.length, collections.length);
        done();
      });
      zip.on('error', done);
    });
  }));
}