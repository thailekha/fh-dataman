import hasPermission from './permission';
import ForbiddenError from './ForbiddenError';

/**
 * Middleware for adding permission checks on a route.
 *
 * @param {Object} options - Options object.
 * @param {string} [options.permission] - The permission access which defines the access the user has for this permission. e.g. 'read', 'write'
 */
function authorize(options={}) {

  return (req, res, next) => {
    hasPermission(req, options.permission, value => {
      next(value ? null : new ForbiddenError());
    });
  };
}

export default authorize;
