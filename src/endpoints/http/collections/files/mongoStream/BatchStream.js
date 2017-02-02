import stream from 'stream';

var defaultOptions = {
  objectMode: true
};

/**
 * TODO: docs
 */
class BatchStream extends stream.Writable {
  constructor(options={}) {
    super(Object.assign(defaultOptions, options));

    //The writable.cork() method forces all written data to be buffered in memory
    // written? when? to where?
    // why called this in constructor ?
    this.cork();

    //why not just this.on('drain', this.cork) ?
    this.on('drain', this.cork.bind(this)); //start writing again
  }

  // what will call this?
  write(chunk, encoding, callback) {
    const hasBufferSpace = super.write(chunk, encoding, callback);
    if (!hasBufferSpace) {
      process.nextTick(this.uncork.bind(this));
    }

    return hasBufferSpace;
  }

}

export default BatchStream;
