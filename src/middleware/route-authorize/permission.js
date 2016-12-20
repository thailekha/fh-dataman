import _ from 'lodash';
import fhconfig from 'fh-config';

function getRouteData(req) {
  return [
    _.get(req, 'user.permissions', []),
    _.get(req, 'params.appname', 'appName'),
    _.get(req, 'user.entity.guid', 'entityGuid')
  ];
}

/**
 * Responsible for checking whether permissions are correct.
 *
 * @param {Object} req - The route request object containing granted permissions.
 * @param {string} permission - The permission for the route e.g. 'read', 'write'
 * @param {function} cb - Callback function.
 */
export default function(req={}, permission='', cb) {
  if (typeof cb !== 'function') {
    throw new Error('cb must be a function');
  }

  const [permissions, appName, entityGuid] = getRouteData(req);
  const routeBusinessObject = fhconfig.value('businessObject');
  const isAuthorized = appName === entityGuid && permissions.some(p => p.businessObject === routeBusinessObject && p.permissions[permission]);

  cb(isAuthorized);
}


//TODO: need to update tests
