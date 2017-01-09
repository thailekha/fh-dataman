import chai from 'chai';
import chaiHttp from 'chai-http';
chai.use(chaiHttp);
var expect = chai.expect;
var testConf = require('./test_conf.json');
const SERVER_URL = `http://localhost:${testConf.port}`;

export function test_sys_ping(done) {
  chai.request(SERVER_URL)
    .get('/sys/info/ping')
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(200);
      done();
    });
}

export function test_sys_health(done) {
  chai.request(SERVER_URL)
    .get('/sys/info/health')
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(200);
      done();
    });
}

