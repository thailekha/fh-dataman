import stream from 'stream';
import json from 'JSONStream';
import csvParse from 'csvtojson';
import bsonParse from 'bson-stream';
import bson from 'bson';
import deserialize from 'mongodb-extended-json/lib/deserialize';

/**
 * @TODO: docs
 */
class csvIdTransform extends stream.Transform {
  constructor() {
    super({objectMode:true});
  }

  _transform(data, encoding, cb) {
    const id = data._id.split(/[()]/)[1];
    data._id = bson.ObjectID(id);
    this.push(data);
    cb();
  }
}

class ExtendedJSON extends stream.Transform {
  constructor() {
    super({objectMode:true});
  }

  _transform(data, encoding, cb) {
    var eJSON = deserialize(data);
    this.push(eJSON);
    cb();
  }
}

export default {
  'application/json': () => [json.parse(), new ExtendedJSON()],
  'text/csv': () => [csvParse({checkType: true}, {objectMode:true}), new csvIdTransform()],
  'application/octet-stream': () => [new bsonParse()]
};
