import stream from 'stream';
//import json from 'JSONStream';
import csvParse from 'csvtojson';
import bsonParse from 'bson-stream';
import mongoExtendedJSON from 'mongodb-extended-json';

/**
 * @TODO: docs
 */
class csvIdTransform extends stream.Transform {
  constructor() {
    super({objectMode:true});
  }

  _transform(data, encoding, cb) {
    data._id = data._id.split(/[()]/)[1];
    this.push(data);
    cb();
  }
}

export default {
  'application/json': [mongoExtendedJSON.createParseStream('*')],
  'text/csv': [csvParse({}, {objectMode:true}), new csvIdTransform()],
  'application/octet-stream': [new bsonParse()]
};
