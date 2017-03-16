import Busboy from 'busboy';
import concat from 'concat-stream';
import yauzl from 'yauzl';
import EventEmitter from 'events';

const busboyEventTypes = ['field', 'partsLimit', 'filesLimit', 'fieldsLimit', 'error'];
const zipMimeType = 'application/zip';

function getZipEntries(promises, zipFile) {
  promises.push(new Promise((resolve, reject) => {
    const entries = [];

    //document why we need to get a buffer
    file.pipe(concat(buffer => {
      //need to understand lazyentries before submitting the review.
      yauzl.fromBuffer(buffer, {lazyEntries: false}, (err, zip) => {
        if (err) {
          return reject(err);
        }

        //check for folders

        zip.on('entry', function(entry) {
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
        return self.emit('zip', fieldname, file, fileName, encoding);
      }

      self.emit('file', fieldname, file, fileName, encoding, mimetype);
    });

    self.busboy.on('zip', (fieldname, file, fileName, encoding) => {
      self.zipFiles.push({fieldname, file, fileName, encoding});
    });

    self.busboy.on('finish', () => {
      if (!self.zipFiles.length) {
        return self.emit('finish');
      }

      const emitFiles = function(zipFile) {
        zipFile.forEach(fileInfos => {
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
  }

  pipe(dest) {
    this.busboy.pipe(dest);
  }
}
