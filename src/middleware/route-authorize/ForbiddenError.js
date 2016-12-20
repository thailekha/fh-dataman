class ForbiddenError extends Error {
  constructor(message) {
    super();
    this.name = 'ForbiddenError';
    this.message = message || 'Forbidden Error';
    this.code = 403;
  }
}

export default ForbiddenError;
