'use strict';

const cfg = require('./config');
const fs = require('fs-extra');
const path = require('path');
const superagent = require('superagent');

async function run () {

  const version = cfg.getVersion(true);
  const nupkgVersion = cfg.getNupkgVersion(version);
  const uploadToBintray = bintray({
    ...cfg.bintray,
    apiKey: cfg.getBintrayApiKey(),
    packageName: cfg.appInfos.name,
  });

  await uploadToBintray({ filepath: cfg.getBundleFilepath('rpm', version), version });
  await uploadToBintray({ filepath: cfg.getBundleFilepath('deb', version), version });
  await uploadToBintray({ filepath: cfg.getBundleFilepath('nupkg', version), version: nupkgVersion });
}

function bintray ({ user, apiKey, subject, packageName }) {

  const basicAuth = Buffer.from(`${user}:${apiKey}`).toString('base64');

  return function ({ filepath, version }) {
    const { ext, name: filename } = path.parse(filepath);
    const repo = ext.slice(1);
    const url = `https://api.bintray.com/content/${subject}/${repo}/${packageName}/${version}/${filename}.${repo}`;
    const isStableVersion = cfg.isStableVersion();
    const debianDistribution = isStableVersion ? 'stable' : 'unstable';
    const debianComponent = isStableVersion ? 'main' : 'beta';
    console.log(`Uploading ${repo} on Bintray...`);
    console.log(`\tfile ${filepath}`);
    console.log(`\tto ${url}`);
    return httpPut({
      url,
      qs: { publish: '1', override: '1' },
      body: fs.createReadStream(filepath),
      headers: {
        'Content-Type': 'application/zip',
        Authorization: `Basic ${basicAuth}`,
        // Mandatory specifications for debian
        'X-Bintray-Debian-Distribution': debianDistribution,
        'X-Bintray-Debian-Component': debianComponent,
        'X-Bintray-Debian-Architecture': 'amd64',
      },
    });
  };
}

function httpPut ({ url, qs, body, headers }) {
  return new Promise((resolve, reject) => {
    const req = superagent
      .put(url)
      .set(headers)
      .query(qs)
      .on('error', (err) => {
        console.log({ err });
        reject(err);
      })
      .on('response', (res) => {
        console.log({ res });
        return resolve(res);
      });
    body.pipe(req);
  });
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
