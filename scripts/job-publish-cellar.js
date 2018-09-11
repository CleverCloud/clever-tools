'use strict';

const AWS = require('aws-sdk');
const cfg = require('./config');
const fs = require('fs-extra');

async function run () {

  const { archList, releasesDir } = cfg;
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
    const archiveExt = (arch === 'win') ? '.zip' : '.tar.gz';
    const archivePath = `${releasesDir}/${version}/clever-tools-${version}_${arch}${archiveExt}`;
    await uploadToCellar(`${archivePath}`);
    await uploadToCellar(`${archivePath}.sha256`);
    if (isStableVersion) {
      const latestArchivePath = `${releasesDir}/lastest/clever-tools-lastest_${arch}${archiveExt}`;
      await uploadToCellar(`${archivePath}`, `${latestArchivePath}`);
      await uploadToCellar(`${archivePath}.sha256`, `${latestArchivePath}.sha256`);
    }
  }

  // .rpm
  const rpmPath = `${releasesDir}/${version}/clever-tools-${version}.rpm`;
  await uploadToCellar(`${rpmPath}`);
  await uploadToCellar(`${rpmPath}.sha256`);
  if (isStableVersion) {
    const latestRpmPath = `${releasesDir}/lastest/clever-tools-lastest.rpm`;
    await uploadToCellar(`${latestRpmPath}`);
    await uploadToCellar(`${latestRpmPath}.sha256`);
  }

  // .deb
  const debPath = `${releasesDir}/${version}/clever-tools-${version}.deb`;
  await uploadToCellar(`${debPath}`);
  await uploadToCellar(`${debPath}.sha256`);
  if (isStableVersion) {
    const latestDebPath = `${releasesDir}/lastest/clever-tools-lastest.deb`;
    await uploadToCellar(`${latestDebPath}`);
    await uploadToCellar(`${latestDebPath}.sha256`);
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
