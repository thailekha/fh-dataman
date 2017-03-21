import BusboyZip from '../BusboyZip';
import assert from 'assert';
import fs from 'fs';

export function testZip(done) {
  const busboyZip = new BusboyZip({headers: {'content-type': 'multipart/form-data; boundary=--------------------------983350277728140328948716'}});

  busboyZip.on('file', function(fieldname, file, fileName, encoding, mimetype) {
    console.log([fieldname, fileName, encoding, mimetype]);
  });

  busboyZip.on('zip', function(fieldname, file, fileName, encoding) {
    console.log([fieldname, fileName, encoding]);
  });

  busboyZip.on('finish', function() {
    done();
  });

  busboyZip.on('error', function() {
    assert.ok(false);
  });

  busboyZip.pipeToBusboy(fs.createReadStream(`${__dirname}/fixture/collections.zip`));
}