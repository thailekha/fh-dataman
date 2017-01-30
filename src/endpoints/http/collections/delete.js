const _ = require('ramda');

/**
 *  Get index of an item in an array
 */
const indexIn = _.curry((xs, x) => xs.indexOf(x));

/**
 * Push an item onto an array and return the array
 */
const pushAndReturn = _.curry(function(xs, x) {
  xs.push(x);
  return xs;
});

/**
 * Greater than or equal to
 */
const gte = _.curry((y, x) => x >= y);

/**
 * Invoke a method of any object, use no argument
 */
const call0 = _.invoker(0);

/**
 * Invoke a method of any object, use 1 argument
 */
const call1 = _.invoker(1);

/**
 * Deletes collection(s) for a given app.
 *
 * @param {String} appname The appname. It should be in the format of "<domain>-<appGuid>-<envId>".
 * @param {object} logger The logger object.
 * @param {db} db The db connection.
 * @param {String[]} collections The array of collection name(s) to be deleted.
 * @returns Promise
 */
const deleteCollection = _.curry(function(appname, logger, db, collection) {
  logger.debug({appname}, 'deleting collection');

  const handlerDeleted = () => ({name: collection});

  return _.pipe(call1('dropCollection')(collection), call1('then')(handlerDeleted))(db); //send db through the pipe
});

export default function deleteCollections(appname, logger, db, reqCollections) {
  //for filtering
  const collectionItemPredicate = _.compose(gte(0), indexIn(reqCollections), _.prop('name'));

  //for reducing
  const collectDeletePromises = (accPromises, item) => _.compose(pushAndReturn(accPromises), deleteCollection(appname, logger, db), _.prop('name'))(item); //apply item to the composed function

  const promiseAll = xs => Promise.all(xs);

  const handleSucessfulListCollections = collections => _.compose(promiseAll, _.reduce(collectDeletePromises,[]), _.filter(collectionItemPredicate))(collections); //apply collection to the composed function

  return  _.pipe(call0('listCollections'), call0('toArray'), call1('then')(handleSucessfulListCollections))(db); //send db through the pipe
}