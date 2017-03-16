class BatchStreamReceivedBufferError extends Error {
  constructor(message, fileName, lineNumber) {
    super(message || 'BatchStream Received Buffer error', fileName, lineNumber);
    this.code = 22000;
    this.name = 'BatchStreamReceivedBufferError';
  }
}

export default BatchStreamReceivedBufferError;
