import * as storage from './mongoStream';

const CONFLICT = 409;

export function getCollectionName(fileName) {
  const collectionName = fileName.split('.');
  collectionName.pop();
  return collectionName.join('.');
}

function collectionExists(collections, name) {
  return collections.some(collection => collection.name === name);
}

/**
 * TODO: docs
 */
export function insertCollection(file, name, db) {

  return new Promise((resolve, reject) => {
    const insertStream = new storage.InsertStream({db: db, collectionName: name});

    db.listCollections()
      .toArray((err, collections) => {
        if (err || collectionExists(collections, name)) {
          return reject(err || {message: `Collection ${name} already exists`, code: CONFLICT});
        }

        file
          .pipe(insertStream)
          .on('finish', resolve)
          .on('error', reject);
      });
  });
}
