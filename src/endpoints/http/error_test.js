import errorHandler from "./error.js";
import sinon from "sinon";
import assert from "assert";
import {getLogger} from '../../logger';

const logger = getLogger();

var req = {
  log: logger
};

export function testValidationError(done) {
  var res = {
    status: sinon.spy(),
    json: sinon.spy()
  };
  var err = {name: 'JsonSchemaValidation', message: 'validation error'};
  errorHandler(err, req, res, function() {});
  assert.ok(res.status.calledWith(400));
  done();
}

export function testError(done) {
  var res = {
    status: sinon.stub(),
    json: sinon.spy()
  };
  res.status.returns(res);
  var err = new Error('this is an error');
  err.code = 501;
  errorHandler(err, req, res, function() {});
  assert.ok(res.status.calledWith(501));
  assert.ok(res.json.calledWithMatch({message: 'this is an error'}));
  done();
}