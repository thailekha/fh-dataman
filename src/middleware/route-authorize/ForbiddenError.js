function ForbiddenError(message) {
  this.name = 'ForbiddenError';
  this.message = message || 'Forbidden Error';
  this.code = 403;
  this.stack = (new Error()).stack;
}

ForbiddenError.prototype = Object.create(Error.prototype);
ForbiddenError.prototype.constructor = ForbiddenError;

export default ForbiddenError;
