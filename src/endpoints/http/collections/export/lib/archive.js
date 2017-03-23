import yazl from 'yazl';

/**
 * Gets the size of each collection requested to export.
 *
 * @param {Stream} collections - An array of streams containing each collection's documents.
 * @returns {Stream} - Stream containing zip entries for each collection.
 */
export default function archive(collections=[]) {
  const zipFile = new yazl.ZipFile();
  collections.forEach(collection => {
    zipFile.addReadStream(collection, `${collection.filename}`);
  });
  zipFile.end();
  return zipFile.outputStream;
}