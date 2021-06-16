'use strict';

const cfg = require('./config');
const { promises: fs } = require('fs');
const path = require('path');
const superagent = require('superagent');

const NEXUS_HOST = 'https://nexus.clever-cloud.com';
const NEXUS_RPM = NEXUS_HOST + '/repository/yum-test-private/';
const NEXUS_DEB = NEXUS_HOST + '/repository/apt-test-private/';
const NEXUS_NUPKG = NEXUS_HOST + '/repository/nuget-test-private/';

async function run () {

  const version = cfg.getVersion(true);
  const nexusAuth = cfg.getNexusAuth();

  await publishRpmToNexus({ nexusAuth, filepath: cfg.getBundleFilepath('rpm', version) });
  await publishDebToNexus({ nexusAuth, filepath: cfg.getBundleFilepath('deb', version) });
  await publishNupkgToNexus({ nexusAuth, filepath: cfg.getBundleFilepath('nupkg', version) });
}

// https://help.sonatype.com/repomanager3/formats/yum-repositories
async function publishRpmToNexus ({ nexusAuth, filepath }) {

  const { base: filename } = path.parse(filepath);
  const targetUrl = new URL(filename, NEXUS_RPM).toString();
  const filebuffer = await fs.readFile(filepath);

  console.log(`Uploading rpm on Nexus...`);
  console.log(`  file ${filepath}`);
  console.log(`  to ${NEXUS_RPM}`);

  return superagent
    .put(targetUrl)
    .auth(nexusAuth.user, nexusAuth.password)
    .on('progress', displayProgress())
    .send(filebuffer)
    .then(() => {
      console.log(`  DONE!`);
    });
}

// https://help.sonatype.com/repomanager3/formats/apt-repositories
async function publishDebToNexus ({ nexusAuth, filepath }) {

  const filebuffer = await fs.readFile(filepath);

  console.log(`Uploading deb on Nexus...`);
  console.log(`  file ${filepath}`);
  console.log(`  to ${NEXUS_DEB}`);

  return superagent
    .post(NEXUS_DEB)
    .auth(nexusAuth.user, nexusAuth.password)
    .type('multipart/form-data')
    .on('progress', displayProgress())
    .send(filebuffer)
    .then(() => console.log('  DONE!'));;
}

// https://help.sonatype.com/repomanager3/formats/nuget-repositories/deploying-packages-to-nuget-hosted-repositories#DeployingPackagestoNuGetHostedRepositories-AccessingyourNuGetAPIKey
async function publishNupkgToNexus ({ nexusAuth, filepath }) {

  const { base: filename } = path.parse(filepath);
  const targetUrl = new URL(filename, NEXUS_NUPKG).toString();
  const filebuffer = await fs.readFile(filepath);

  console.log(`Uploading nupkg on Nexus...`);
  console.log(`  file ${filepath}`);
  console.log(`  to ${NEXUS_NUPKG}`);

  return superagent
    .put(targetUrl)
    .set('X-NuGet-ApiKey', nexusAuth.nugetApiKey)
    .attach('data', filebuffer)
    .on('progress', displayProgress())
    .then(() => console.log('  DONE!'));
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

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
