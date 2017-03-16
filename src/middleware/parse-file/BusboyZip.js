import Busboy from 'busboy';
import concat from 'concat-stream';
import yauzl from 'yauzl';
import EventEmitter from 'events';

const busboyEventTypes = ['field', 'partsLimit', 'filesLimit', 'fieldsLimit', 'error'];
const zipMimeType = 'application/zip';
const extensionRegrex = /(?:\.([^.]+))?$/;

function getMimeType(fileName) {
  return {
    '.json': 'application/json',
    '.csv': 'text/csv',
    '.bson': 'application/octet-stream'
  }[extensionRegrex.exec(fileName)[0]];
}

function getZipEntries(zipFile) {
  return new Promise((resolve, reject) => {
    const entries = [];

    //document why we need to get a buffer
    zipFile.pipe(concat(buffer => {
      //need to understand lazyentries before submitting the review.
      yauzl.fromBuffer(buffer, {lazyEntries: false}, (err, zip) => {
        if (err) {
          return reject(err);
        }

        zip.on('entry', function(entry) {
          zip.openReadStream(entry, function(err, file) {
            if (err) {
              return reject(err);
            }

            if (entry.fileName.includes('__MACOSX')) {
              return;
            }

            const mimetypeAndEncoding = getMimeType(entry.fileName);

            entries.push({
              file: file,
              fieldname: '',
              fileName: entry.fileName,
              encoding: mimetypeAndEncoding,
              mimetype: mimetypeAndEncoding
            });
          });
        });

        zip.on('end', () => {
          resolve(entries);
        });
      });
    }));
  });
}

/**
 * docs
 */
export default class extends EventEmitter {

  constructor(options={}) {
    super();

    const self = this;
    self.busboy = new Busboy(options);
    self.zipEntries = [];

    //test these events
    busboyEventTypes.forEach(function(eventType) {
      self.busboy.on(eventType, function() {
        const args = [].slice.call(arguments);
        args.unshift(eventType);
        self.emit.apply(self, args);
      });
    });

    self.busboy.on('file', (fieldname, file, fileName, encoding, mimetype) => {
      if (mimetype === zipMimeType) {
        return self.emit('zip', fieldname, file, fileName, encoding);
      }

      self.emit('file', fieldname, file, fileName, encoding, mimetype);
    });

    self.on('zip', (fieldname, zipFile, fileName) => {
      if (!fileName) {
        // Must always handle filestream even if no underlying file resource actually exists.
        return zipFile.resume();
      }

      self.zipEntries.push(getZipEntries(zipFile));
    });
  }

  write(chunk, encoding, cb) {
    this.busboy.write(chunk, cb);
  }

  end() {
    var self = this;
    if (!self.zipEntries.length) {
      self.busboy.end();
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
    Promise.all(self.zipEntries)
      .then(emitFiles)
      .then(() => {
        process.nextTick(() => {
          self.busboy.end();
          self.emit('finish');
        });
      })
      .catch(err => {
        self.emit('error', err);
        self.busboy.end();
      });
  }
}
