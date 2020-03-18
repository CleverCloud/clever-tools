'use strict';

const cfg = require('./config');
const fs = require('fs-extra');
const https = require('https');
const path = require('path');

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
    const host = 'api.bintray.com';
    const requestPath = `/content/${subject}/${repo}/${packageName}/${version}/${filename}.${repo}?publish=1&override=1`;
    const isStableVersion = cfg.isStableVersion();
    const debianDistribution = isStableVersion ? 'stable' : 'unstable';
    const debianComponent = isStableVersion ? 'main' : 'beta';
    console.log(`Uploading ${repo} on Bintray...`);
    console.log(`\tfile ${filepath}`);
    console.log(`\tto ${host} ${requestPath}`);
    return httpPut({
      host,
      requestPath,
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

// We use https module directly because we had pb with streams and superagent
function httpPut ({ host, requestPath, body, headers }) {
  return new Promise((resolve, reject) => {

    const opts = {
      host,
      path: requestPath,
      method: 'put',
      headers,
    };

    function onResp (resp) {
      resp.on('data', () => {
      });
      resp.on('end', () => resolve());
    }

    const req = https
      .request(opts, onResp)
      .on('error', reject);

    body.pipe(req);
  });
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
