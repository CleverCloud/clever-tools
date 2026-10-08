import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import mime from 'mime-types';
import fs from 'node:fs/promises';

/**
 * A client for interacting with Clever Cloud's Cellar object storage service.
 * Provides methods for uploading, downloading, and managing files in S3-compatible storage.
 */
export class CellarClient {
  #host = 'cellar-c2.services.clever-cloud.com';
  #bucket;
  #client;

  /**
   * Creates a new CellarClient instance.
   * @param {Object} config - Configuration object
   * @param {string} [config.host] - The Cellar host (defaults to cellar-c2.services.clever-cloud.com)
   * @param {string} config.bucket - The S3 bucket name
   * @param {string} config.accessKeyId - AWS access key ID
   * @param {string} config.secretAccessKey - AWS secret access key
   */
  constructor({ host, bucket, accessKeyId, secretAccessKey }) {
    if (host != null) {
      this.#host = host;
    }
    this.#bucket = bucket;
    this.#client = new S3Client({
      endpoint: 'https://' + this.#host,
      region: 'not-used',
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
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
   * @throws {Error} When the object doesn't exist or isn't valid JSON
   */
  async getObject(path) {
    const response = await this.#client.send(new GetObjectCommand({ Bucket: this.#bucket, Key: path }));
    if (!response.Body) {
      throw new Error('No response body received');
    }
    const content = await response.Body.transformToString();
    return content;
  }

  /**
   * Uploads a local file to the bucket.
   *
   * @param {string} filepath - The local file path to upload
   * @param {string} [remoteFilepath=filepath] - The destination path in the bucket
   * @throws {Error} When the file cannot be read or uploaded
   */
  async upload(filepath, remoteFilepath = filepath) {
    const body = await fs.readFile(filepath);
    await this.putObject(body, remoteFilepath);
  }

  /**
   * Uploads multiple local files to the bucket with bounded parallelism.
   * @param {Array<{ filepath: string, remoteFilepath: string }>} items - Files to upload
   * @param {Object} [options]
   * @param {number} [options.concurrency=8] - Max uploads in flight at once
   * @param {(item: { filepath: string, remoteFilepath: string }) => void} [options.onUpload] - Called before each upload starts
   * @throws {Error} When any upload fails
   */
  async uploadFiles(items, { concurrency = 8, onUpload } = {}) {
    await this.#runInPool(items, concurrency, async (item) => {
      onUpload?.(item);
      await this.upload(item.filepath, item.remoteFilepath);
    });
  }

  /**
   * Uploads raw data to the bucket with automatic content type detection.
   * @param {Buffer|string} body - The data to upload
   * @param {string} remoteFilepath - The destination path in the bucket
   * @throws {Error} When the upload fails
   */
  async putObject(body, remoteFilepath) {
    const contentType = mime.lookup(remoteFilepath) || undefined;
    await this.#client.send(
      new PutObjectCommand({
        Bucket: this.#bucket,
        Key: remoteFilepath,
        Body: body,
        ContentType: contentType,
        ACL: 'public-read',
      }),
    );
  }

  /**
   * Deletes all objects that match the given prefix, with bounded parallelism.
   *
   * @param {string} remoteFilepath - The path prefix to delete (can be a file or directory)
   * @param {Object} [options]
   * @param {number} [options.concurrency=8] - Max deletes in flight at once
   * @throws {Error} When the deletion fails
   */
  async delete(remoteFilepath, { concurrency = 8 } = {}) {
    const keys = await this.listObjects(remoteFilepath);
    await this.#runInPool(keys, concurrency, async (key) => {
      await this.#client.send(
        new DeleteObjectCommand({
          Bucket: this.#bucket,
          Key: key,
        }),
      );
    });
  }

  /**
   * Lists all objects in the bucket that match the given prefix.
   * @param {string} path - The path prefix to search for
   * @returns {Promise<Array<string>>}
   * @throws {Error} When the listing fails
   */
  async listObjects(path) {
    const response = await this.#client.send(
      new ListObjectsCommand({
        Bucket: this.#bucket,
        Prefix: path,
      }),
    );

    if (response.Contents != null) {
      return response.Contents.map((c) => c.Key).filter((key) => key != null);
    }

    return [];
  }

  /**
   * Runs `fn` over `items` with at most `concurrency` tasks in flight at once.
   * Workers share the queue via `shift()` — safe under JS's single-threaded model.
   * @template T
   * @param {T[]} items
   * @param {number} concurrency
   * @param {(item: T) => Promise<void>} fn
   * @returns {Promise<void>}
   */
  async #runInPool(items, concurrency, fn) {
    const queue = items.slice();
    const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (item === undefined) break;
        await fn(item);
      }
    });
    await Promise.all(workers);
  }
}
