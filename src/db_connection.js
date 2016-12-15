import fhconfig from 'fh-config';
var fhconfig;
var fhMbaasClient = require('fh-mbaas-client');
var db = require('fh-db');
var _ = require('underscore');

//1. get the app guid and the environment information from the request
//2. use this information to get the mongodb connection url from fh-mbaas
//3. establish the connection using fh-db
//4. attach the fh-db connection to the request object

module.exports = function(req, cb) {
  var client = new fhMbaasClient.MbaasClient(req.envId, conifg.mbaasConf);
  var app_env_vars = client.admin.apps.envVars.get();
  console.log("config", fhconfig);
  console.log("app env vars: ", app_env_vars);

  if (_.isObject(app_env_vars)) {
      //establish connection
      if ('FH_MONGODB_CONN_URL' in app_env_vars){
        //app has its own db. Pass it to fh-db to establish direct connection tp app's db'
        var params = {
          __dbperapp: true,
          connectionUrl: app_env_vars.FH_MONGODB_CONN_URL
        };
        var dbConnection = db.mongo_compat_api(params); //creates direct connection to db and returns monogo handle
        console.log("dedicated db: ", dbConnection)
      } else {
          //use connection details from the config file - shared mongodb
          var dbConnection = fhconfig.FH_MONGODB_CONN_URL;
          console.log("shared db: ", dbConnection)
      }
      //attach db connection to request object
      req.dbConnection = dbConnection;
      return cb(null, req.dbConnection)
  }
  return cb("Error getting db connection");
};

