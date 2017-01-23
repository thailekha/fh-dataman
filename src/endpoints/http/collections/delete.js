/**
 * Deletes collection(s) for a given app.
 *
 * @param {String} appname The appname. It should be in the format of "<domain>-<appGuid>-<envId>".
 * @param {object} logger The logger object.
 * @param {db} db The db connection.
 * @param {String[]} collections The array of collection name(s) to be deleted.
 * @returns Promise
 */
function deleteCollection(appname, logger, db, collection) {
  logger.debug({appname}, 'deleting collection');
  return db.dropCollection(collection)
    .then(function() {
      return {name: collection};
    });
}

export default function deleteCollections(appname, logger, db, reqCollections) {
  return db.listCollections()
    .toArray()
    .then(function(collections) {
      const promises = collections.filter(function(item) {
        return reqCollections.indexOf(item.name) >= 0;
      }).reduce((acc, item) => {
        acc.push(deleteCollection(appname, logger, db, item.name));
        return acc;
      }, []);

      return Promise.all(promises);
    });
}