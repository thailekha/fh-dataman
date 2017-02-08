import mongoExtendedJSON from 'mongodb-extended-json';

const MAX_MONGO_WRITES = 1000;

var defaultOptions = {
  objectMode: true,
  highWaterMark: MAX_MONGO_WRITES
};

function insert(data, fn, cb) {
  this.db.collection(this.collectionName, function(err, collection) {
    if (err) {
      return this.emit('error', err);
    }

    collection[fn](data, cb);
  }.bind(this));
}

/**
 * TODO: docs
 */
var InsertMixin = Base => class extends Base {

  constructor(options={}) {
    if (!options.db || !options.collectionName) {
      throw new Error('Can not initialise without db or collectionName option');
    }

    const opts = Object.assign(defaultOptions, options);
    opts.highWaterMark = Math.min(opts.highWaterMark, MAX_MONGO_WRITES);

    super(opts);

    this.db = options.db;
    this.collectionName = options.collectionName;
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
