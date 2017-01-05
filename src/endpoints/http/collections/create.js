function message(message) {
  return { message };
}

/**
 * Add the route to create a new collection for the users App.
 * This route expects a db connection to be present on the request object.
 *
 * @param {object} router - The express router.
 */
export function createCollection(router) {
  router.post("/collections", (req, res, next) => {
    const name = req.body.name;
    if (!name) {
      return res.status(400).send(message('name is required'));
    }

    req.log.debug({name}, 'creating new collection');
    req.db.createCollection(req.body.name, err => {
      if (err) {
        return next(err);
      }

      req.log.trace({name}, 'new collection created');
      res.status(201).send(message('ok'));
    });
  });
}
