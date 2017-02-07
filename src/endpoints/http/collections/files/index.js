import { InsertStream } from './mongoStream';

export function getCollectionName(fileName) {
  const collectionName = fileName.split('.');
  collectionName.pop();
  return collectionName.join('.');
}

/**
 * TODO: docs
 */
export function uploadCollection(file, collectionName, db) {

  return new Promise((resolve, reject) => {
    const insertStream = new InsertStream({db: db, collectionName});

    db.listCollections()
      .toArray((err, collections) => {
        if (err || collections.indexOf(collectionName) > -1) {
          return reject(err || new Error(`${collectionName} already exists`));
        }

        file
          .pipe(insertStream)
          .on('finish', resolve)
          .on('error', reject);
      });
  });
}
