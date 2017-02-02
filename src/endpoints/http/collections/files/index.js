import parseFile from '../../../../middleware/parse-file';
import { InsertStream } from './mongoStream';

const CREATED = 200;
const BAD_REQUEST = 400;

/**
 * TODO: docs
 */
export default router => {

  router.post('/collections/upload', parseFile(), (req, res, next) => {
    if (!req.file) {
      return next({message: 'No file', code: BAD_REQUEST});
    }

    //must be available before /collections/upload' is called
    req.file
      .pipe(new InsertStream({db: req.db}))
      .on('finish', () => {
        res.status(CREATED).end();
      })
      .on('error', next);
  });
};
