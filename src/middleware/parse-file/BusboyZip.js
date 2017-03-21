import Busboy from 'busboy';
import concat from 'concat-stream';
import yauzl from 'yauzl';
import EventEmitter from 'events';

const busboyEventTypes = ['field', 'partsLimit', 'filesLimit', 'fieldsLimit', 'error'];
const zipMimeType = 'application/zip';

//just a helper function to catch all events being emitted
function patchEmitter(emitter) {
  var oldEmit = emitter.emit;

  emitter.emit = function() {
    console.log('Emitted event:', arguments['0']);
    //var caller = new Error().stack;
    //console.log(caller);
    oldEmit.apply(emitter, arguments);
  };
}

function getZipEntries(promises, zipFile) {
  console.log(1);
  promises.push(new Promise((resolve, reject) => {
    console.log(2);
    const entries = [];

    //document why we need to get a buffer
    zipFile.pipe(concat(buffer => {
      //need to understand lazyentries before submitting the review.
      yauzl.fromBuffer(buffer, {lazyEntries: false}, (err, zip) => {
        console.log(3);
        if (err) {
          return reject(err);
        }

        //check for folders

        zip.on('entry', function(entry) {
          console.log(4);
          zip.openReadStream(entry, function(err, file) {
            if (err) {
              return reject(err);
            }
            // emit correct mimetype. maybe get from entry.
            entries.push({
              file: file,
              fieldname: 'testFieldName',
              fileName: 'testfileName',
              encoding: 'testencoding',
              mimetype: 'testmimetype'
            });
          });
        });

        zip.on('end', () => {
          resolve(entries);
        });
      });
    }));
  }));

  return promises;
}

/**
 * docs
 */
export default class extends EventEmitter {

  constructor(options={}) {
    super();

    const self = this;
    self.busboy = new Busboy(options);
    self.zipFiles = [];

    busboyEventTypes.forEach(function(eventType) {
      self.busboy.on(eventType, function() {
        const args = [].slice.call(arguments);
        args.unshift(eventType);
        self.emit.apply(self, args);
      });
    });

    self.busboy.on('file', (fieldname, file, fileName, encoding, mimetype) => {
      if (mimetype === zipMimeType) {
        console.log('is zip');
        return self.emit('zip', fieldname, file, fileName, encoding);
      }
      console.log('not zip');
      self.emit('file', fieldname, file, fileName, encoding, mimetype);
    });

    self.busboy.on('zip', (fieldname, file, fileName, encoding) => {
      self.zipFiles.push({fieldname, file, fileName, encoding});
    });

    self.busboy.on('finish', () => {
      if (!self.zipFiles.length) {
        console.log('no zip file');
        return self.emit('finish');
      }

      const emitFiles = function(zipFiles) {
        zipFiles.forEach(fileInfos => {
          fileInfos.forEach(fileInfo => {
            self.emit('file', fileInfo.fieldname, fileInfo.file, fileInfo.fileName, fileInfo.encoding, fileInfo.mimetype);
          });
        });

        return Promise.resolve();
      };

      //make this more readable
      const entries = self.zipFiles.reduce(getZipEntries, []);
      Promise.all(entries)
        .then(emitFiles)
        .then(() => process.nextTick(() => self.emit('finish')))
        .catch(err => self.emit('error', err));
    });

    //no idea why this doesn't work
    // self.write = self.busboy.write;
    // self.end = self.busboy.end;

    patchEmitter(self.busboy);
  }

  pipeToBusboy(src) {
    return src.pipe(this.busboy);
  }

  pipe(dest) {
    return this.busboy.pipe(dest);
  }

  // write(chunk, encoding, cb) {
  //   return this.busboy.write(chunk, encoding, cb);
  // }

  // end(chunk, encoding, cb) {
  //   return this.busboy.end(chunk, encoding, cb);
  // }
}
