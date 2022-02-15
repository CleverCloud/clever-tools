'use strict';

const cfg = require('./config');
const { promises: fs } = require('fs');
const path = require('path');
const superagent = require('superagent');

const NEXUS_DEB = {
  stable: 'https://nexus.clever-cloud.com/repository/deb/',
  beta: 'https://nexus.clever-cloud.com/repository/deb-beta/',
};
const NEXUS_NUPKG = {
  stable: 'https://nexus.clever-cloud.com/repository/nupkg/',
  beta: 'https://nexus.clever-cloud.com/repository/nupkg-beta/',
};
const NEXUS_RPM = {
  stable: 'https://nexus.clever-cloud.com/repository/rpm/',
  beta: 'https://nexus.clever-cloud.com/repository/rpm-beta/',
};

async function run () {

  const version = cfg.getVersion(true);
  const isStableVersion = cfg.isStableVersion();
  const releaseType = isStableVersion ? 'stable' : 'beta';
  const nexusAuth = cfg.getNexusAuth();

  let errorCount = 0;

  await publishDebToNexus({ releaseType, nexusAuth, filepath: cfg.getBundleFilepath('deb', version) })
    .catch(() => errorCount += 1);

  await publishNupkgToNexus({ releaseType, nexusAuth, filepath: cfg.getBundleFilepath('nupkg', version) })
    .catch(() => errorCount += 1);

  // TODO: implement automatic signature and enable this
  // await publishRpmToNexus({ releaseType, nexusAuth, filepath: cfg.getBundleFilepath('rpm', version) })
  //   .catch(() => errorCount += 1);

  if (errorCount > 0) {
    throw new Error('Some error occured while publishing assets to Nexus.');
  }
}

async function publishDebToNexus ({ releaseType, nexusAuth, filepath }) {

  const nexusRepo = NEXUS_DEB[releaseType];

  const filebuffer = await fs.readFile(filepath);

  console.log(`Uploading deb on Nexus...`);
  console.log(`  file ${filepath}`);
  console.log(`  to ${nexusRepo}`);

  return superagent
    .post(nexusRepo)
    .auth(nexusAuth.user, nexusAuth.password)
    .set('accept', 'application/json')
    .type('multipart/form-data')
    .on('progress', displayProgress())
    .send(filebuffer)
    .then(() => console.log('  DONE!'))
    .catch((error) => {
      console.error(`  FAILED!`);
      console.error(`  ${getNexusErrorFromHtml(error.response.text)}`);
      throw error;
    });
}

async function publishNupkgToNexus ({ releaseType, nexusAuth, filepath }) {

  const nexusRepo = NEXUS_NUPKG[releaseType];

  const { base: filename } = path.parse(filepath);
  const targetUrl = new URL(filename, nexusRepo).toString();
  const filebuffer = await fs.readFile(filepath);

  console.log(`Uploading nupkg on Nexus...`);
  console.log(`  file ${filepath}`);
  console.log(`  to ${nexusRepo}`);

  return superagent
    .put(targetUrl)
    .set('X-NuGet-ApiKey', nexusAuth.nugetApiKey)
    .attach('data', filebuffer)
    .on('progress', displayProgress())
    .then(() => console.log('  DONE!'))
    .catch((error) => {
      console.error(`  FAILED!`);
      console.error(`  ${error.response.error.message}`);
      throw error;
    });
}

async function publishRpmToNexus ({ releaseType, nexusAuth, filepath }) {

  const nexusRepo = NEXUS_RPM[releaseType];

  const { base: filename } = path.parse(filepath);
  const targetUrl = new URL(filename, nexusRepo).toString();
  const filebuffer = await fs.readFile(filepath);

  console.log(`Uploading rpm on Nexus...`);
  console.log(`  file ${filepath}`);
  console.log(`  to ${nexusRepo}`);

  return superagent
    .put(targetUrl)
    .auth(nexusAuth.user, nexusAuth.password)
    .on('progress', displayProgress())
    .send(filebuffer)
    .then(() => console.log(`  DONE!`))
    .catch((error) => {
      console.error(`  FAILED!`);
      console.error(`  ${error.response.error.message}`);
      throw error;
    });
}

function displayProgress () {
  let lastPercent = 0;
  return (event) => {
    const percent = Math.floor((event.loaded / event.total) * 100);
    if (percent > lastPercent + 15 || percent === 100) {
      lastPercent = percent;
      console.log(`  ${percent}%`);
    }
  };
}

// Very cheap way of trying to get an error message from Nexus
function getNexusErrorFromHtml (html) {
  return html
    .replace(/^.*<div class="content-section">/s, '')
    .replace(/<\/.*$/s, '')
    .trim();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
