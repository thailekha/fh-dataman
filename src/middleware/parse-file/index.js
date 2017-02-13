import Busboy from 'busboy';
import parsers from './parsers';

const  UNSUPPORTED_MEDIA = 415;

function setParsers(file, mimeType) {
  const parserChain = typeof parsers[mimeType] === 'function' && parsers[mimeType]();
  if (!parserChain) {
    return null;
  }

  return parserChain.reduce((file, parser) => file.pipe(parser), file);
}

/**
 * Middleware to parse incoming form file data.
 * parse-file will attach a stream parser chain to the file to present the data in the required format.
 * Parsers will be retrieved from parsers.js and will be mapped based on the mime type of the incoming file.
 *
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

    busboy.on('file', function(fieldname, file, fileName, encoding, mimetype) {
      if (!fileName) {
        // Must always handle filestream even if no underlying file resource actually exists.
        return file.resume();
      }

      req.file = setParsers(file, mimetype) || file;
      req.file.meta = {fileName, encoding, mimetype};

      next(null);
    });

    busboy.on('error', next);

    req.pipe(busboy);

  };

}
