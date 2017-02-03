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

    this.cork();

    this.on('drain', this.cork.bind(this));
  }

  write(chunk, encoding, callback) {
    const hasBufferSpace = super.write(chunk, encoding, callback);
    if (!hasBufferSpace) {
      process.nextTick(this.uncork.bind(this));
    }

    return hasBufferSpace;
  }

}

export default BatchStream;
