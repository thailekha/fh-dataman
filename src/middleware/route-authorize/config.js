/**
 * Configuration object.
 */
export default {
  /**
   * Define where to find the permission on the request object.
   * Uses 'lodash.get' syntax.
   */
  globalPermissionPath: 'user.businessObject',

  /**
   * Define the path prefix to find the permission access on the request object.
   * If the access parameter is defined on middleware creation this value will be used to calculate the access value path.
   * Uses 'lodash.get' syntax.
   */
  globalAccessPrefix: 'user.permission.',

  /**
   * Define the path prefix to find the permission access on the request object.
   * If the access parameter is defined on middleware creation this value will be used to calculate the access value path.
   * Uses 'lodash.get' syntax.
   */
  globalRoutePermission: 'data-browser',

  /**
   * Map of permissions for each Route. Overrides globalRoutePermission.
   */
  routePermissions: {}
};
