const mockFhConfig = {
  mbaasConf: {
    project: "someprojectid",
    app: "someappid",
    accessKey: "somekeytoaccessmbaasenv",
    url: "https://mbaas.someplace.com",
    username: "someusername",
    password: "somepassword"
  },
  FH_MONGODB_CONN_URL: "shareddbconnection"
};
const mockConnectionDeps = {
  "fh-config": mockFhConfig,
  "fh-mbaas-client": {},
  "fh-db": {}
};

const proxyquire = require('proxyquire');
const assert = require("assert");
const db_connection = proxyquire("../db_connection.js", mockConnectionDeps);

module.exports = {
  testSharedDb: function(finish) {
    const req = {
      envId: "123"
    };

    const res = "shareddbconnection";

    db_connection(req, function(err, resp) {
      assert.equal(res, resp);
      finish();
    });
  }
};
