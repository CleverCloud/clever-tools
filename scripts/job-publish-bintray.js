'use strict';

const cfg = require('./config');
const fs = require('fs-extra');
const path = require('path');
const request = require('request');

async function run () {

  const version = cfg.getVersion(true);
  const uploadToBintray = bintray({
    ...cfg.bintray,
    apiKey: cfg.getBintrayApiKey(),
    packageName: cfg.appInfos.name,
  });

  await uploadToBintray({ filepath: cfg.getBundleFilepath('rpm'), version });
  await uploadToBintray({ filepath: cfg.getBundleFilepath('deb'), version });
}

function bintray ({ user, apiKey, subject, packageName }) {

  const basicAuth = Buffer.from(`${user}:${apiKey}`).toString('base64');

  return function ({ filepath, version }) {
    const { ext, name: filename } = path.parse(filepath);
    const repo = ext.slice(1);
    const url = `https://api.bintray.com/content/${subject}/${repo}/${packageName}/${version}/${filename}.${repo}`;
    console.log(`Uploading ${repo} on Bintray...`);
    console.log(`\tfile ${filepath}`);
    console.log(`\tto ${url}`);
    return httpPut({
      url,
      qs: { publish: '1', override: '1' },
      body: fs.createReadStream(filepath),
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        // Mandatory specifications for debian
        'X-Bintray-Debian-Distribution': 'stable',
        'X-Bintray-Debian-Component': 'main',
        'X-Bintray-Debian-Architecture': 'amd64',
      },
    });
  };
}

function httpPut ({ url, qs, body, headers }) {
  return new Promise((resolve, reject) => {
    request.put({ url, qs, body, headers }, (err, res) => {
      if (err) {
        return reject(err);
      }
      if (res.statusCode >= 400) {
        const error = new Error('Failed to do HTTP PUT\n' + err.statusCode + '\n' + err.body);
        return reject(error);
      }
      return resolve(res);
    });
  });
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
