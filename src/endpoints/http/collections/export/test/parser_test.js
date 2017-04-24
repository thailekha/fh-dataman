import parser from '../lib/parser';
import fs from 'fs';
import assert from 'assert';
import json from 'JSONStream';

export function testBSON(done) {
  const collection = fs.createReadStream(`${__dirname}/export.bson`);
  parser.bson(collection).then(res => {
    assert.equal(collection, res);
    done();
  });
}

export function testJSON(done) {
  const collection = fs.createReadStream(`${__dirname}/export.json`).pipe(json.parse());
  collection.filename = 'collection.json';
  parser.json(collection).then(res => {
    assert.equal(collection.filename, res.filename);
    res.on('data', data => {
      assert.equal(typeof data, 'string');
    });
    res.on('end', done);
  });
}

export function testCSV(done) {
  const collection = fs.createReadStream(`${__dirname}/export.json`).pipe(json.parse());
  collection.filename = 'collection.csv';
  parser.csv(collection).then(res => {
    assert.equal(collection.filename, res.filename);
    res.on('data', data => {
      assert.equal(typeof data, 'string');
    });
    res.on('end', done);
  });
}