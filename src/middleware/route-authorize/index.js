import _ from 'lodash';
import config from './config';
import ForbiddenError from './ForbiddenError';

function defaults(options) {
  return {
    permissionPath: authorize.config.globalPermissionPath,
    accessPath: options.access ? `${authorize.config.globalAccessPrefix}${options.access}` : ''
  };
}

/**
 * Middleware for adding permission checks on a route.
 * This middleware expects 2 permissions resources on the request object.
 * The permission id/name which defines the permission the user has.
 * The permission access which defines the access the user has for this permission. e.g. 'read', 'write'
 *
 * @param {Object} options - Options object.
 * @param {string} [options.access] - If defined will be used with config.globalAccessPrefix to calculate path to permission access.
 * @param {Array|string} [options.accessPath] - Define where to find the permission access on the request object.
 *                                              Uses 'lodash.get' syntax.
 * @param {Array|string} options.permissionPath=config.globalPermissionPath - Define where to find the permission id on the request object.
 *                                                                            Uses 'lodash.get' syntax.
 */
function authorize(options={}) {
  const {accessPath, permissionPath} = Object.assign(defaults(options), options);

  if (!accessPath || !permissionPath) {
    throw new Error('accessPath and permissionPath are required');
  }

  return (req, res, next) => {
    const reqPermission = _.get(req, permissionPath, false);
    const routePermission = authorize.config.routePermissions[req.url] || authorize.config.globalRoutePermission;
    if (!reqPermission || reqPermission !== routePermission) {
      return next(new ForbiddenError('Incorrect permission'));
    }

    const reqAccess = _.get(req, accessPath, false);
    if (typeof reqAccess !== 'boolean' || !reqAccess) {
      return next(new ForbiddenError('Incorrect access'));
    }

    next(null);
  };
}

authorize.config = config;

export default authorize;
