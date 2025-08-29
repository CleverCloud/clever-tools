import pkg from '../../package.json' with { type: 'json' };

/**
 * Sanitizes a version string by replacing forward slashes with hyphens.
 * This is useful for converting branch names to version identifiers.
 * @param {string} rawVersion - The raw version string to sanitize
 * @returns {string}
 */
export function getVersion(rawVersion) {
  return rawVersion.replaceAll('/', '-');
}

/**
 * Retrieves the author information from the package.json file.
 * The author should be in the format "Name <email>".
 * @returns {{name: string, email: string}}
 * @throws {Error} If the author format is invalid
 */
export function getPackageAuthor() {
  const author = pkg.author.match(/^(?<name>.+?) <(?<email>.+)>$/)?.groups;
  if (!author) {
    throw new Error('Invalid author format in package.json. Expected "Name <email>"');
  }
  return {
    name: author.name,
    email: author.email,
  };
}
