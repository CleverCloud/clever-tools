import { highlight } from './terminal.js';

const REGISTRY_URL = 'https://registry.npmjs.org';
const RETRY_COUNT = 3;
const RETRY_DELAY = 5000;

/**
 * Gets the SHA512 hash of a package tarball published on the npm registry.
 *
 * The hash is derived from the "dist.integrity" field of the version document,
 * so the tarball itself never needs to be downloaded.
 *
 * The registry is written to by "npm publish" but read through a CDN, so a version
 * published seconds ago may still be answered with a 404: the read is retried a few times.
 *
 * @param {string} name - The package name
 * @param {string} version - The package version
 * @returns {Promise<string>} The tarball SHA512 hash, hex encoded
 * @throws {Error} When the version cannot be read or has no SHA512 integrity field
 */
export async function getNpmTarballSha512(name, version) {
  const url = `${REGISTRY_URL}/${name}/${version}`;

  console.log(highlight`=> Getting tarball integrity of ${name} ${version} from ${REGISTRY_URL}`);
  const versionDocument = await fetchJsonWithRetry(url);

  const integrity = versionDocument?.dist?.integrity;
  if (typeof integrity !== 'string' || !integrity.startsWith('sha512-')) {
    throw new Error(`Could not read a SHA512 integrity for ${name}@${version}`);
  }

  const base64Hash = integrity.slice('sha512-'.length);
  return Buffer.from(base64Hash, 'base64').toString('hex');
}

/**
 * Fetches a JSON document, retrying a few times on failure.
 * @param {string} url - The URL to fetch
 * @returns {Promise<any>} The parsed JSON document
 * @throws {Error} When all attempts failed
 */
async function fetchJsonWithRetry(url) {
  let lastError;

  for (let attempt = 1; attempt <= RETRY_COUNT; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < RETRY_COUNT) {
        console.log(highlight`=> Could not fetch ${url}, retrying in ${RETRY_DELAY / 1000}s`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }

  throw new Error(`Could not fetch ${url}: ${lastError instanceof Error ? lastError.message : lastError}`);
}
