const _ = require('ramda');

//===================
// Reusable (start)
//===================

/* For debugging
const log = _.curry(function (id,x){
  console.log('=====');
  console.log('logger ' + id);
  console.dir(x);
  console.log('=====');
  return x;
});
*/

//=====================================
//Functor and Functor utilities (start)
//=====================================

const Maybe = function(x) {
  this.__value = x;
};

Maybe.of = function(x) {
  return new Maybe(x);
};

Maybe.prototype.isNothing = function() {
  return this.__value === undefined || this.__value === null;
};

Maybe.prototype.map = function(f) {
  return this.isNothing() ? Maybe.of(null) : Maybe.of(f(this.__value));
};

Maybe.prototype.join = function() {
  return this.isNothing() ? Maybe.of(null) : this.__value;
};

Maybe.prototype.chain = function(f) {
  this.map(f).join();
};

/**
 * Pull out the value from the functor
 */
//  maybe :: b -> (a -> b) -> Maybe a -> b
const maybe = _.curry(function(err, f, functor) {
  return functor.isNothing() ? err : f(functor.__value);
});

/**
 * Apply a function on a functor
 */
const map = _.curry((f, functor) => functor.map(f));

/**
 * Apply a function that returns a functor on a functor
 */
const chain = _.curry(function(f, functor) {
  return functor.map(f).join();
});

const conditionalIdentity = _.curry(function(predicate, item) {
  return predicate(item) ? Maybe.of(item) : Maybe.of(null);
});

//=====================================
//Functor and Functor utilities (end)
//=====================================

//=======================
//Other utilities (start)
//=======================

const identity = x => x;

/**
 * Greater than or equal to
 */
const gte = _.curry(function(y, x) {
  return x >= y;
});

/**
 *  Get index of an item in an array
 */
const indexIn = _.curry((xs, x) => xs.indexOf(x));

/**
 * Check if an item is an an array
 */
const isInArray = xs => _.compose(gte(0), indexIn(xs));

/**
 * Push an item onto an array and return the array
 */
const pushAndReturn = _.curry(function(xs, x) {
  xs.push(x);
  return xs;
});

//safeProp :: string -> a -> b
const safeProp = _.curry(function(prop, obj) {
  return obj.hasOwnProperty(prop) ? Maybe.of(obj[prop]) : Maybe.of(null);
});

//=======================
//Other utilities (end)
//=======================

//===================
// Reusable (end)
//===================

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
  return db.dropCollection(collection).then(handlerDeleted); //send db through the pipe
});

export default function deleteCollections(appname, logger, db, reqCollections) {
  //const collectionItemPredicate = _.compose(maybe(false,identity), map(isInArray(reqCollections)), safeProp('name'));
  const filterCollectionItem = conditionalIdentity(isInArray(reqCollections));

  //for reducing
  // :: [a] -> a -> [a]
  const filterAndCollectDeletePromises = (accPromises, item) => _.compose(
    maybe(accPromises,identity),
      map(_.compose(pushAndReturn(accPromises),deleteCollection(appname, logger, db))), 
        chain(filterCollectionItem),
          safeProp('name')
  )(item); //apply item to the composed function

  const promiseAll = xs => Promise.all(xs);

  const handleSucessfulListCollections = collections => _.compose(promiseAll,_.reduce(filterAndCollectDeletePromises,[]))(collections); //apply collection to the composed function

  return db.listCollections().toArray().then(handleSucessfulListCollections);
}