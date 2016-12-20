import async from 'async';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import chai from 'chai';
import chaiHttp from 'chai-http';
import statusCodes from '../../src/endpoints/statusCodes.js';
chai.use(chaiHttp);
var expect = chai.expect;
import * as mongodbClient from './mongodb_client';
var testConf = require('./test_conf.json');

const SERVER_URL = `http://localhost:${testConf.port}`;
const PATH_PREFIX = '/api/testing/dev/testappguid/data';
const payload = {
  user: {
    email: "test@email.com",
    username: "user101",
    domain: "testing",
    sub: "1234subdomain"
  },
  businessObject: "fh-dataman-permission",
  permission: {
    write: true,
    read: true
  }
};
const TOKEN = jwt.sign(payload, testConf.auth.secret);

const COLLECTIONS = [
  {name: 'test1', docs: [{field1: 'field1', field2:'field2'}]},
  {name: 'test2', docs: [{field1: 'field1', field2:'field2'}]}
];

module.exports = {
  'test_collections': {
    'before': function(done) {
      mongodbClient.createCollectionsWithDocs(COLLECTIONS, done);
    },

    'test_collection_list': function(done) {
      chai.request(SERVER_URL)
          .get(`${PATH_PREFIX}/collections`)
          .set('Authorization', `Bearer ${TOKEN}`)
          .end((err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.status(statusCodes.SUCCESS);
            expect(res).to.be.json;
            expect(res.body).to.have.lengthOf(4); //there will be system.users and system.indexes as well
            const col1 = res.body.filter(col => col.name === COLLECTIONS[0].name);
            const col2 = res.body.filter(col => col.name === COLLECTIONS[1].name);
            expect(col1[0].count).to.equal(COLLECTIONS[0].docs.length);
            expect(col2[0].count).to.equal(COLLECTIONS[1].docs.length);
            done();
          });
    },

    'test_collection_create': function(done) {
      chai.request(SERVER_URL)
          .post(`${PATH_PREFIX}/collections`)
          .send({name: 'testCreate'})
          .set('Authorization', `Bearer ${TOKEN}`)
          .end((err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.status(statusCodes.CREATED);
            expect(res.text).to.equal('testCreate collection created');
            done();
          });
    },

    'testCollectionDelete': done => {
      chai.request(SERVER_URL)
         .delete(`${PATH_PREFIX}/collections`)
         .query({names: 'test1,test2'})
         .set('Authorization', `Bearer ${TOKEN}`)
         .end((err, res) => {
           expect(err).to.be.null;
           expect(res).to.have.status(statusCodes.SUCCESS);
           expect(res.text).to.equal('test1,test2 collection(s) deleted');
           done();
         });
    },

    'test_collection_upload': function(done) {
      const test = (ext, cb) => {
        chai.request(SERVER_URL)
          .post(`${PATH_PREFIX}/collections/upload`)
          .attach('file', fs.readFileSync(`${__dirname}/fixture/import.${ext}`), `import.${ext}` )
          .set('Authorization', `Bearer ${TOKEN}`)
          .end((err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.status(statusCodes.CREATED);
            mongodbClient.dropCollection('import', cb);
          });
      };

      async.eachSeries(['json','csv','bson'],  test, done);
    }
  }
};
