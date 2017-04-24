class UnsupportedMediaError extends Error {
  constructor(message, fileName, lineNumber) {
    super(message || 'Unsupported Media Error', fileName, lineNumber);
    this.code = 415;
    this.name = 'UnsupportedMediaError';
  }
}

export default UnsupportedMediaError;
