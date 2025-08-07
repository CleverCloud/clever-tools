/**
 * A simple client for interacting with Clever Cloud's Cellar object storage service.
 * This client only handles objects that are publicly accessible.
 */
export class CellarClientPublic {
  #host = 'cellar-c2.services.clever-cloud.com';
  #bucket;

  /**
   * Creates a new CellarClientPublic instance.
   * @param {Object} config - Configuration object
   * @param {string} [config.host] - The Cellar host (defaults to cellar-c2.services.clever-cloud.com)
   * @param {string} config.bucket - The S3 bucket name
   */
  constructor({ host, bucket }) {
    if (host != null) {
      this.#host = host;
    }
    this.#bucket = bucket;
  }

  /**
   * Generates a public URL for a file in the bucket.
   * If the bucket name contains dots, it's treated as a domain name.
   * @param {string} remoteFilepath - The path to the file in the bucket
   * @returns {string}
   */
  getPublicUrl(remoteFilepath) {
    // If bucket contains dots, we assume it's a domain
    if (this.#bucket.includes('.')) {
      return `https://${this.#bucket}/${remoteFilepath}`;
    }
    return `https://${this.#bucket}.${this.#host}/${remoteFilepath}`;
  }

  /**
   * Downloads an object as string from the bucket.
   * @param {string} path - The path to the object in the bucket
   * @returns {Promise<string>}
   * @throws {Error} When the object doesn't exist or can't be fetched
   */
  async getObject(path) {
    const url = this.getPublicUrl(path);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch object at ${path}: ${response.status} ${response.statusText}`);
    }
    return await response.text();
  }
}
