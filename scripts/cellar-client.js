const AWS = require('aws-sdk');
const fs = require('fs-extra');
const mime = require('mime-types');
const { getCellarConf } = require('./config.js');

// Forces the *.sha256 files to be uploaded with a text/plain mime type.
mime.types['sha256'] = 'text/plain';

const CELLAR_CLIENTS = {};

function getCellarClient(scope) {
  if (CELLAR_CLIENTS[scope] == null) {
    const conf = getCellarConf(scope)
    if (!conf.accessKeyId || !conf.secretAccessKey) {
      throw new Error('Could not read Cellar access/secret keys!');
    }

    CELLAR_CLIENTS[scope] = cellar(conf);
  }

  return CELLAR_CLIENTS[scope];
}

function cellar ({ accessKeyId, secretAccessKey, host, bucket }) {

  const s3 = new AWS.S3({
    credentials: { accessKeyId, secretAccessKey },
    endpoint: new AWS.Endpoint(host),
    signatureVersion: 'v4',
  });

  const client = {
    url(remoteFilepath) {
      return `https://${bucket}/${remoteFilepath}`;
    },
    async exists(remoteFilepath) {
      return new Promise((resolve, reject) => {
        const params = { Bucket: bucket, Key: remoteFilepath };
        return s3.headObject(params, (err, data) => err ? reject(err) : resolve());
      }).then(() => {
        return true;
      }).catch((e) => {
        if (e.statusCode === 404) {
          return false;
        }
        throw e;
      });
    },
    async upload(filepath, remoteFilepath = filepath) {
      return client.putObject(fs.createReadStream(filepath), remoteFilepath);
    },
    async putObject(body, remoteFilepath) {
      return new Promise((resolve, reject) => {
        const params = { ACL: 'public-read', Body: body, Bucket: bucket, Key: remoteFilepath, ContentType: mime.lookup(remoteFilepath) || null, };
        return s3.putObject(params, (err) => err ? reject(err) : resolve());
      });
    },
    async delete(remoteFilepath) {
      const objects = await client.listObjects(remoteFilepath);

      return Promise.all(
        objects
          .map((object) => new Promise((resolve, reject) => {
            return s3.deleteObject({ Bucket: bucket, Key: object.Key }, (err) => err ? reject(err) : resolve())
          }))
      );
    },
    async listObjects(path) {
      return new Promise((resolve, reject) => {
        return s3.listObjects(
          { Bucket: bucket, Prefix: path},
          (err, data) => err ? reject(err) : resolve(data.Contents))
      });
    },
    async getObject(path) {
      return new Promise((resolve, reject) => {
        return s3.getObject(
          { Bucket: bucket, Key: path},
          (err, data) => err ? reject(err) : resolve(data.Body))
      }).then((body) => {
        return JSON.parse(body.toString())
      });
    }
  }

  return client;
}

module.exports = {
  getCellarClient,
};
