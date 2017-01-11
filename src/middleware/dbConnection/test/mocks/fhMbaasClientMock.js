/**
 * Mock function to dictate the behaviour of
 * the MbaasClient function in 'fh-mbaas-client'
 *
 * @param {object} stub
 */
module.exports = stub => function MbaasClient() {
  return {
    admin: {
      apps: {
        envVars: {
          get: stub
        }
      }
    }
  };
};