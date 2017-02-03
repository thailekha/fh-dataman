const _r = require('ramda');

//===================
// Reusable (start)
//===================

//For debugging
const log = _r.curry(function (id,x){
  console.log('=====');
  console.log('logger ' + id);
  console.dir(x);
  console.log('=====');
  return x;
});

//=====================================
//Functor and Functor utilities (start)
//=====================================

/**
 * Either Left functor
 * @param {any} x Anything to be held in the functor
 */
const Left = function(x) {
  this.__value = x;
};

/**
 * Construct a Left functor
 * @constructor
 * @param {any} x Anything to be held in the functor
 * @return {Left} Left functor
 */
Left.of = function(x) {
  return new Left(x);
};

/**
 * Identity
 * @return {Left} Left functor
 */
Left.prototype.map = function() {
  return this;
};

/**
 * Identity
 * @return {Left} Left functor
 */
Left.prototype.join = function() {
  return this;
};

/**
 * Identity
 * @return {Left} Left functor
 */
Left.prototype.chain = function() {
  return this;
};

/**
 * Either Right functor
 * @param {any} x Anything to be held in the functor
 */
const Right = function(x) {
  this.__value = x;
};

/**
 * Construct a Right functor
 * @constructor
 * @param {any} x Anything to be held in the functor
 * @return {Right} Right functor
 */
Right.of = function(x) {
  return new Right(x);
};

/**
 * Apply a function to the value within the functor
 * @param {function} f Function to be applied
 * @return {Right} Right functor
 */
Right.prototype.map = function(f) {
  return Right.of(f(this.__value));
};

/**
 * Ressolve the nested functor
 * @return {Right} Right functor
 */
Right.prototype.join = function() {
  return this.__value;
};

/**
 * Apply a function to the value within the functor,
 * the function also returns a functor which results in a nested functor.
 * So `join` is done to ressolve the nesting.
 * @param {function} f Function to be applied
 * @return {Right} Right functor
 */
Right.prototype.chain = function(f) {
  this.map(f).join();
};

/**
 * Retrieve the actual value from the functor and apply a function on it
 * @param {any} err Anything to be returned if the functor is a Left
 * @param {function} f The function to be applied on the actual value
 * @param {functor} functor The functor that holds the desired value
 * @returns {any}
 */
const either = _r.curry(function(err,f,functor) {
  switch (functor.constructor) {
  case Left: return (err === undefined || err === null) ? functor : err; //???
  case Right: return f(functor.__value);
  }
  //may need to throw exception here for invalid functor
});

/**
 * (Functor Map - point-free style) Apply a function on a functor
 * @param {function} f Function to be applied
 * @param {functor} functor Functor which the function will be applied on
 * @return {functor}
 */
const _m = _r.curry(function(f, functor) {
  return functor.map(f);
});

/**
 * (Functor Chain - point-free style)
 * Apply a function that returns a functor on a functor and ressolve the nesting (map + join)
 * @param {function} f Function to be applied
 * @param {functor} functor Functor which the function will be applied on
 * @return {functor}
 */
const _c = _r.curry(function(f, functor) {
  return functor.map(f).join();
});

/**
 * Access a property (attribute) of an object
 * @param {String} prop The property
 * @param {object} obj The object
 * @returns {functor}
 */
const safeProp = _r.curry(function(prop, obj) {
  return obj.hasOwnProperty(prop) ? Right.of(obj[prop]) : Left.of("Object does not have " + prop + " property");
});

/**
 * Similar to identity function but the result is put in a functor and is either the item or an error message
 * @param {function} predicate Function the returns a boolean
 * @param {any} item
 * @return {functor}
 */
const conditionalIdentity = _r.curry(function(predicate, item) {
  return predicate(item) ? Right.of(item) : Left.of("Item " + item + " does not satisfy predicate");
});

//=====================================
//Functor and Functor utilities (end)
//=====================================

//=======================
//Other utilities (start)
//=======================

/**
 * Return whatever passed in (like identity in maths)
 * @param {any} x
 * @return {any}
 */
const identity = x => x;

/**
 * Greater than or equal to
 * @param {number} y
 * @param {number} x
 * @return {boolean}
 */
const gte = _r.curry((y, x) => x >= y);

/**
 * Get index of an item in an array
 * @param {[]} xs
 * @param {any} x
 * @return {number}
 */
const indexIn = _r.curry((xs, x) => xs.indexOf(x));

/**
 * Check if an item is an an array
 * @param {[]} xs
 * @param {any} (omitted)
 * @param {boolean}
 */
const isInArray = xs => _r.compose(gte(0), indexIn(xs));

/**
 * Push an item to an array and return the array
 * @param {[]} xs The array
 * @param {object} x The item to be pushed on the array
 * @returns {[]} The array with the new item added
 */
const pushAndReturn = _r.curry(function(xs, x) {
  xs.push(x);
  return xs;
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
const deleteCollection = _r.curry(function(appname, logger, db, collection) {
  logger.debug({appname}, 'deleting collection');

  const handlerDeleted = () => ({name: collection});

  return db.dropCollection(collection).then(handlerDeleted); //send db through the pipe
});

export default function deleteCollections(appname, logger, db, reqCollections) {
  const promiseAll = xs => Promise.all(xs);

  const collectionArrays = db => db.listCollections().toArray();

  const filterCollectionItem = conditionalIdentity(isInArray(reqCollections));

  const filterAndCollectDeletePromises = (accPromises, item) => _r.compose(
    either(accPromises,identity), //temporary solution, discouraged
    _m(_r.compose(pushAndReturn(accPromises),deleteCollection(appname, logger, db))), 
    _c(filterCollectionItem),
    safeProp('nam')
  )(item); //apply item to the composed function

  const handleSucessfulListCollections = collections => _r.compose(log(1),promiseAll,log(0),_r.reduce(filterAndCollectDeletePromises,[]))(collections); //apply collection to the composed function

  var result = .then(handleSucessfulListCollections);

  console.log(result);

  return result;
  //return db.listCollections().toArray().then(handleSucessfulListCollections);
}