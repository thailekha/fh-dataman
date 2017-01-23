import Busboy from 'busboy';
import parsers from './parsers';

const  UNSUPPORTED_MEDIA = 415;

/**
 * @TODO: docs
 */
export default function() {

  return (req, res, next) => {
    let busboy;
    try {
      // Busboy will throw 'Unsupported content type' and 'Missing Content-Type' errors.
      busboy = new Busboy({ headers: req.headers});
    } catch (err) {
      err.code = UNSUPPORTED_MEDIA;
      return next(err);
    }

    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
      if (!filename) {
        // Must always handle filestream even if no underlying file resource actually exists.
        return file.resume();
      }

      req.file = parsers.set(file, mimetype) || file;

      next(null);
    });

    busboy.on('error', next);

    req.pipe(busboy);

  };

}
