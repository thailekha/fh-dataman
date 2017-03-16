import BusboyZip from './BusboyZip';
import parsers from './parsers';
import UnsupportedMediaError from './UnsupportedMediaError';

/**
 * Set stream parser chain on the uploaded file stream.
 *
 * @param {object} file - FileReadStream.
 * @param {string} mimetype - Attach parser chain based on the file mime type
 *TODOO: update docs for meta
 * @returns {object} - A WriteStream that will stream the file data in the correct parsed format.
 */
function setParsers(file, mimetype) {
  const parserChain = typeof parsers[mimetype] === 'function' && parsers[mimetype]();

  if (!parserChain) {
    return null;
  }

  file = parserChain.reduce((file, parser) => file.pipe(parser), file);
  return file;
}

/**
 * Middleware to parse incoming form file data.
 * parse-file will attach a stream parser chain to the file to present the data in the required format.
 * Parsers will be retrieved from parsers.js and will be mapped based on the mime type of the incoming file.
 */
export default function() {

  return (req, res, next) => {
    let busboyZip;
    try {
      // BusboyZip will throw 'Unsupported content type' and 'Missing Content-Type' errors.
      busboyZip = new BusboyZip({ headers: req.headers });
    } catch (err) {
      return next(new UnsupportedMediaError());
    }

    req.files = [];

    busboyZip.on('file', function(fieldname, file, fileName, encoding, mimetype) {

      if (!fileName) {
        // Must always handle filestream even if no underlying file resource actually exists.
        return file.resume();
      }

      file = setParsers(file, mimetype) || file;
      file.meta = {fileName, encoding, mimetype};
      req.files.push(file);
    });

    busboyZip.on('finish', next);
    busboyZip.on('error', next);

    req.pipe(busboyZip);
  };

}
