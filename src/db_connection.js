"use-strict";
const fhconfig = require("fh-config");
const fhMbaasClient = require("fh-mbaas-client");
const db = require("fh-db");

//1. get the app the environment information from the request
//2. use this information to get the mongodb connection url from fh-mbaas
//3. establish the connection using fh-db
//4. attach the fh-db connection to the request object

module.exports = function(req, cb) {
  const params = {
    environment: {},
    domain: {},
    appname: {}
  };
  const client = new fhMbaasClient.MbaasClient(req.envId, fhconfig.mbaasConf);
  const appEnvVars = client.admin.apps.envVars.get(params, function(err, resp){
      if (err) {
          console.log("err: ",err)    
          cb(err);
      }
  });
  console.log("appEnvVars: ", appEnvVars);
  if (appEnvVars && appEnvVars.FH_MONGODB_CONN_URL) {
    const params = {
      __dbperapp: true,
      connectionUrl: appEnvVars.FH_MONGODB_CONN_URL
    };
    const dedicatedConnection = db.mongo_compat_api(params); //creates direct connection to db and returns monogo handle
    req.dbConnection = dedicatedConnection; //attaches db connection to request
    return cb(null, dedicatedConnection);
  } else {
    const sharedConnection = fhconfig.FH_MONGODB_CONN_URL; //use connection details from the config file - shared mongodb
    req.dbConnection = sharedConnection; //attaches db connection to request
    return cb(null, sharedConnection);
  }
};

