'use strict';

const AWS = require('aws-sdk');
const crypto = require('crypto');
const del = require('del');
const exec = require('child_process').exec;
const fs = require('fs-extra');
const pkg = require('pkg').exec;
const request = require('request');

const applicationName = 'clever-tools';
const applicationVendor = 'Clever Cloud';
const applicationUrl = 'https://github.com/CleverCloud/clever-tools';
const applicationDescription = 'Command Line Interface for Clever Cloud.';
const license = 'MIT';

const nodeVersion = process.versions.node;
const cleverToolsVersion = process.env.GIT_TAG_NAME || 'master';
const releasesDir = 'releases';
const scriptsDir = 'scripts';

const accessKeyId = process.env.S3_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_KEY;
const cellarHost = 'cellar.services.clever-cloud.com';
const s3Bucket = 'clever-tools';

const bintrayUser = 'ci-clevercloud';
const bintrayApiKey = process.env.BINTRAY_API_KEY;
const bintrayAuth = Buffer.from(`${bintrayUser}:${bintrayApiKey}`).toString('base64');
const bintraySubject = 'clevercloud';
const bintrayPackage = 'clever-tools';

AWS.config.update({ accessKeyId, secretAccessKey });
const s3 = new AWS.S3({
  endpoint: new AWS.Endpoint(cellarHost),
  signatureVersion: 'v2',
});

function asyncExec (command) {
  console.log(`Executing command: ${command}`);
  return new Promise((resolve, reject) => {
    exec(command, (err) => err ? reject(err) : resolve());
  });
}

async function checksum (file) {
  return new Promise((resolve, reject) => {
    const shasum = crypto.createHash('sha256');
    const stream = fs.ReadStream(file);
    stream.on('data', (d) => shasum.update(d));
    stream.on('end', () => resolve(shasum.digest('hex')));
    stream.on('error', reject);
  });
}

function uploadToCellar (filepath, remoteFilepath = filepath) {
  return fs.readFile(filepath).then((Body) => {
    console.log(`Uploading archive on Cellar...`);
    console.log(`\tfile ${filepath}`);
    console.log(`\tto ${remoteFilepath}`);
    return new Promise((resolve, reject) => {
      const params = { ACL: 'public-read', Body, Bucket: s3Bucket, Key: remoteFilepath };
      return s3.putObject(params, (err) => err ? reject(err) : resolve());
    });
  });
}

async function uploadToBintray (filepath, filename, repo) {
  return new Promise((resolve, reject) => {
    const url = `https://api.bintray.com/content/${bintraySubject}/${repo}/${bintrayPackage}/${cleverToolsVersion}/${filename}.${repo}`;
    console.log(`Uploading ${repo} on Bintray...`);
    console.log(`\tfile ${filepath}`);
    console.log(`\tto ${url}`);
    request.put({
      url,
      qs: {
        publish: '1',
        override: '1',
      },
      body: fs.createReadStream(filepath),
      headers: {
        'Authorization': `Basic ${bintrayAuth}`,
        // Mandatory specifications for debian
        'X-Bintray-Debian-Distribution': 'wheezy',
        'X-Bintray-Debian-Component': 'main',
        'X-Bintray-Debian-Architecture': 'amd64',
      },
    }, (err, res) => {
      if (err) {
        reject(err);
      }
      else if (res.statusCode >= 400) {
        const error = new Error('Failed to publish to Bintray\n' + res.statusCode + '\n' + res.body);
        reject(error);
      }
      else {
        resolve(res);
      }
    });
  });
}

async function buildRelease (arch) {

  console.log(`Building release for ${arch}...\n`);

  const cleverTools = (arch === 'win') ? `clever.exe` : 'clever';
  const archiveExt = (arch === 'win') ? '.zip' : '.tar.gz';
  const buildDir = `${releasesDir}/${cleverToolsVersion}`;
  const archivePath = `${buildDir}/clever-tools-${cleverToolsVersion}_${arch}${archiveExt}`;
  const latestArchivePath = `${releasesDir}/latest/clever-tools-latest_${arch}${archiveExt}`;

  await pkg([`.`, `-t`, `node${nodeVersion}-${arch}`, `-o`, `${buildDir}/${arch}/${cleverTools}`]);

  if (arch === 'win') {
    await asyncExec(`zip -j ${archivePath} ${buildDir}/${arch}/${cleverTools}`);
  }
  else {
    await asyncExec(`tar czf "${archivePath}" -C ${buildDir}/${arch} ${cleverTools}`);
  }

  if (arch === 'linux') {
    await buildRpm(buildDir);
    await buildDeb(buildDir);
  }

  await del(`${buildDir}/${arch}`);

  const sum = await checksum(`${archivePath}`);
  await fs.outputFile(`${archivePath}.sha256`, sum);
  await fs.appendFile(`${releasesDir}/sha.properties`, `SHA256_${arch}=${sum}\n`);

  if (cleverToolsVersion !== 'master') {
    const filename = `clever-tools-${cleverToolsVersion}`;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('Could not read S3 access/secret keys!');
    }
    const cellarUploads = Promise.all([
      uploadToCellar(`${archivePath}`),
      uploadToCellar(`${archivePath}.sha256`),
      uploadToCellar(`${archivePath}`, `${latestArchivePath}`),
      uploadToCellar(`${archivePath}.sha256`, `${latestArchivePath}.sha256`),
      uploadToCellar(`${buildDir}/${filename}.rpm`),
      uploadToCellar(`${buildDir}/${filename}.rpm.sha256`),
      uploadToCellar(`${buildDir}/${filename}.deb`),
      uploadToCellar(`${buildDir}/${filename}.deb.sha256`),
    ]);

    if (!bintrayApiKey) {
      throw new Error('Could not read bintray API key!');
    }
    const bintrayUploads = Promise.all([
      uploadToBintray(`${buildDir}/${filename}.rpm`, filename, 'rpm'),
      uploadToBintray(`${buildDir}/${filename}.deb`, filename, 'deb'),
    ]);

    return Promise.all([cellarUploads, bintrayUploads]);
  }

  console.log(`\nRelease BUILT! ${archivePath}\n`);
}

async function buildRpm (buildDir) {
  console.log('Building RPM package...\n');

  const packagePath = `${buildDir}/clever-tools-${cleverToolsVersion}.rpm`;

  await asyncExec(`fpm \
    -s dir \
    -t rpm \
    -p "${packagePath}" \
    -n "${applicationName}" \
    --vendor "${applicationVendor}" \
    --description "${applicationDescription}" \
    --url "${applicationUrl}" \
    --license "${license}" \
    -v ${cleverToolsVersion} \
    ${buildDir}/linux/clever=/usr/lib/clever-tools-bin/clever \
    ${scriptsDir}/clever-wrapper.sh=/usr/bin/clever`);

  const sum = await checksum(`${packagePath}`);
  await fs.outputFile(`${packagePath}.sha256`, sum);
  await fs.appendFile(`${releasesDir}/sha.properties`, `SHA256_rpm=${sum}\n`);

  console.log(`\nRPM BUILT! ${buildDir}/clever-tools-${cleverToolsVersion}.rpm\n`);
}

async function buildDeb (buildDir) {
  console.log('Building DEB package...\n');

  const packagePath = `${buildDir}/clever-tools-${cleverToolsVersion}.deb`;

  await asyncExec(`fpm \
    -s dir \
    -t deb \
    -p "${buildDir}/clever-tools-${cleverToolsVersion}.deb" \
    -n "${applicationName}" \
    --vendor "${applicationVendor}" \
    --description "${applicationDescription}" \
    --license "${license}" \
    -v ${cleverToolsVersion} \
    ${buildDir}/linux/clever=/usr/lib/clever-tools-bin/clever \
    ${scriptsDir}/clever-wrapper.sh=/usr/bin/clever`);

  const sum = await checksum(`${packagePath}`);
  await fs.outputFile(`${packagePath}.sha256`, sum);
  await fs.appendFile(`${releasesDir}/sha.properties`, `SHA256_deb=${sum}\n`);

  console.log(`\nDEB BUILT! ${buildDir}/clever-tools-${cleverToolsVersion}.deb\n`);
}

console.log(`Building releases for cc-tools@${cleverToolsVersion} with node v${nodeVersion}\n`);

del.sync(releasesDir);

Promise.resolve()
  .then(() => buildRelease('linux'))
  .then(() => buildRelease('macos'))
  .then(() => buildRelease('win'))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
