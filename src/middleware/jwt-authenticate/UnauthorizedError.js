class UnauthorizedError extends Error {
  constructor(message) {
    super();
    this.name = 'UnauthorizedError';
    this.message = message || 'Unauthorized Error';
    this.code = 401;
  }
}

export default UnauthorizedError;
