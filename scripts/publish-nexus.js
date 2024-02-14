'use strict';

const cfg = require('./config');
const { promises: fs } = require('fs');
const path = require('path');
const superagent = require('superagent');
const { getBundleFilepath } = require('./paths.js');

const NEXUS_DEB = 'https://nexus.clever-cloud.com/repository/deb/';
const NEXUS_NUPKG = 'https://nexus.clever-cloud.com/repository/nupkg/';
const NEXUS_RPM = 'https://nexus.clever-cloud.com/repository/rpm/';

module.exports = async function publishNexus (version) {

  const nexusAuth = cfg.getNexusAuth();

  const errors = [];

  await publishDebToNexus({ nexusAuth, filepath: getBundleFilepath('deb', version) })
    .catch((error) => errors.push(error));

  await publishNupkgToNexus({ nexusAuth, filepath: getBundleFilepath('nupkg', version) })
    .catch((error) => errors.push(error));

  await publishRpmToNexus({ nexusAuth, filepath: getBundleFilepath('rpm', version) })
    .catch((error) => errors.push(error));

  if (errors.length > 0) {
    console.error(errors);
    throw new Error('Some error occurred while publishing assets to Nexus.');
  }
};

async function publishDebToNexus ({ nexusAuth, filepath }) {

  const filebuffer = await fs.readFile(filepath);

  console.log('Uploading deb on Nexus...');
  console.log(`  file ${filepath}`);
  console.log(`  to ${NEXUS_DEB}`);

  return superagent
    .post(NEXUS_DEB)
    .auth(nexusAuth.user, nexusAuth.password)
    .set('accept', 'application/json')
    .type('multipart/form-data')
    .on('progress', displayProgress())
    .send(filebuffer)
    .then(() => console.log('  DONE!'))
    .catch((error) => {
      console.error('  FAILED!');
      console.error(`  ${getNexusErrorFromHtml(error.response.text)}`);
      throw error;
    });
}

async function publishNupkgToNexus ({ nexusAuth, filepath }) {

  const { base: filename } = path.parse(filepath);
  const targetUrl = new URL(filename, NEXUS_NUPKG).toString();
  const filebuffer = await fs.readFile(filepath);

  console.log('Uploading nupkg on Nexus...');
  console.log(`  file ${filepath}`);
  console.log(`  to ${NEXUS_NUPKG}`);

  return superagent
    .put(targetUrl)
    .set('X-NuGet-ApiKey', nexusAuth.nugetApiKey)
    .attach('data', filebuffer)
    .on('progress', displayProgress())
    .then(() => console.log('  DONE!'))
    .catch((error) => {
      console.error('  FAILED!');
      console.error(`  ${error.response.error.message}`);
      throw error;
    });
}

async function publishRpmToNexus ({ nexusAuth, filepath }) {

  const { base: filename } = path.parse(filepath);
  const targetUrl = new URL(filename, NEXUS_RPM).toString();
  const filebuffer = await fs.readFile(filepath);

  console.log('Uploading rpm on Nexus...');
  console.log(`  file ${filepath}`);
  console.log(`  to ${NEXUS_RPM}`);

  return superagent
    .put(targetUrl)
    .auth(nexusAuth.user, nexusAuth.password)
    .on('progress', displayProgress())
    .send(filebuffer)
    .then(() => console.log('  DONE!'))
    .catch((error) => {
      console.error('  FAILED!');
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
