var fhMbaasClient = require('fh-mbaas-client');
var db = require('fh-db');
var config = process.env.conf_file;
var _ = require('underscore');

//1. get the app guid and the environment information from the request
//2. use this information to get the mongodb connection url from fh-mbaas
//3. establish the connection using fh-db
//4. attach the fh-db connection to the request object


getDbConnection = function(req, cb) {
  var guid = req.appGuid;
  var client = new fhMbaasClient.MbaasClient(req.envId, conifg.mbaasConf);
  var app_env_vars = client.admin.apps.envVars.get();

  if (_.isObject(app_env_vars)) {
      //establish connection
      if ('FH_MONGODB_CONN_URL' in app_env_vars){
          //app has its own db. Pass it to fh-db to establish direct connection
          //to app's db
          
      } else {
          //use connection details from the config file - shared mongodb
      }
      //attach db connection to request object
  }
};

