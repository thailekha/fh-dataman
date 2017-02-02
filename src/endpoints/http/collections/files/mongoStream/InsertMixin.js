import mongoExtendedJSON from 'mongodb-extended-json';

const MAX_MONGO_WRITES = 1000;

var defaultOptions = {
  objectMode: true,
  highWaterMark: MAX_MONGO_WRITES
};

function insert(data, fn, cb) {
  //why not mongoose ?
  this.db.collection('members')[fn](data, cb);
}

/**
 * TODO: docs
 * what is cb ?
 */
var InsertMixin = Base => class extends Base {

  constructor(options={}) {
    if (!options.db) {
      throw new Error('Can not initialise without db option');
    }

    const opts = Object.assign(defaultOptions, options);
    opts.highWaterMark = Math.min(opts.highWaterMark, MAX_MONGO_WRITES);

    super(opts);

    this.db = options.db;
  }

  _write(obj, encoding, cb) {
    // // temporary hack until I figure out the mongoExtendedJSON stream error.
    obj = mongoExtendedJSON.parse(mongoExtendedJSON.stringify(obj));

    insert.call(this, obj, 'insert', cb);
  }

  _writev(chunks, cb) {
    // // temporary hack until I figure out the mongoExtendedJSON stream error.
    const data = chunks.map(bufferObj => mongoExtendedJSON.parse(mongoExtendedJSON.stringify(bufferObj.chunk)));
    insert.call(this, data, 'insertMany', cb);
  }
};


export default InsertMixin;
