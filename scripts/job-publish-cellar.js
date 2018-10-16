'use strict';

const AWS = require('aws-sdk');
const cfg = require('./config');
const fs = require('fs-extra');

async function run () {

  const { archList } = cfg;
  const version = cfg.getVersion(true);
  const isStableVersion = cfg.isStableVersion();

  const accessKeyId = process.env.S3_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_KEY;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error('Could not read S3 access/secret keys!');
  }
  const uploadToCellar = cellar({ accessKeyId, secretAccessKey, ...cfg.cellar });

  // tar.gz and .zip
  for (let arch of archList) {
    const archivePath = cfg.getArchiveFilepath(arch, version);
    await uploadToCellar(`${archivePath}`);
    await uploadToCellar(`${archivePath}.sha256`);
    if (isStableVersion) {
      const latestArchivePath = cfg.getArchiveFilepath(arch, 'latest');
      await uploadToCellar(`${latestArchivePath}`);
      await uploadToCellar(`${latestArchivePath}.sha256`);
    }
  }

  // .rpm
  const rpmPath = cfg.getBundleFilepath('rpm', version);
  await uploadToCellar(`${rpmPath}`);
  await uploadToCellar(`${rpmPath}.sha256`);
  if (isStableVersion) {
    const latestRpmPath = cfg.getBundleFilepath('rpm', 'latest');
    await uploadToCellar(`${rpmPath}`, `${latestRpmPath}`);
    await uploadToCellar(`${rpmPath}.sha256`, `${latestRpmPath}.sha256`);
  }

  // .deb
  const debPath = cfg.getBundleFilepath('deb', version);
  await uploadToCellar(`${debPath}`);
  await uploadToCellar(`${debPath}.sha256`);
  if (isStableVersion) {
    const latestDebPath = cfg.getBundleFilepath('deb', 'latest');
    await uploadToCellar(`${debPath}`, `${latestDebPath}`);
    await uploadToCellar(`${debPath}.sha256`, `${latestDebPath}.sha256`);
  }

  // .nupkg
  const nupkgPath = cfg.getBundleFilepath('nupkg', version);
  await uploadToCellar(`${nupkgPath}`);
  await uploadToCellar(`${nupkgPath}.sha256`);
  if (isStableVersion) {
    const latestNupkgPath = cfg.getBundleFilepath('nupkg', 'latest');
    await uploadToCellar(`${nupkgPath}`, `${latestNupkgPath}`);
    await uploadToCellar(`${nupkgPath}.sha256`, `${latestNupkgPath}.sha256`);
  }
}

function cellar ({ accessKeyId, secretAccessKey, host, bucket }) {

  AWS.config.update({ accessKeyId, secretAccessKey });
  const s3 = new AWS.S3({
    endpoint: new AWS.Endpoint(host),
    signatureVersion: 'v2',
  });

  return async function (filepath, remoteFilepath = filepath) {
    const Body = await fs.readFile(filepath);
    console.log(`Uploading file on Cellar ...`);
    console.log(`\tfile ${filepath}`);
    console.log(`\tto ${remoteFilepath}`);
    return new Promise((resolve, reject) => {
      const params = { ACL: 'public-read', Body, Bucket: bucket, Key: remoteFilepath };
      return s3.putObject(params, (err) => err ? reject(err) : resolve());
    }).then(() => console.log(`\tDONE!`));
  };
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
