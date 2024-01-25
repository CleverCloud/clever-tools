#!/usr/bin/env node

const pkgJson = require('../package.json');
const publishArch = require('./publish-arch.js');
const publishBrew = require('./publish-brew.js');
const { publishCellar, assertRemoteFilesAreOnCellar } = require('./publish-cellar.js');
const publishDockerhub = require('./publish-dockerhub.js');
const publishExherbo = require('./publish-exherbo.js');
const publishNexus = require('./publish-nexus.js');
const publishNpm = require('./publish-npm.js');

const PUBLISHERS = {
  arch: publishArch,
  brew: publishBrew,
  dockerhub: publishDockerhub,
  exherbo: publishExherbo,
  nexus: publishNexus,
  npm: publishNpm,
}
const TARGETS = Object.keys(PUBLISHERS);

async function run () {
  const [version, ...requestedTargets] = process.argv.slice(2);

  if (version == null || version.length === 0) {
    throw new Error(`Missing argument 'version'`);
  }

  assertVersionCoherence(version);
  const job = resolveTargets(requestedTargets);

  if (!job.cellar) {
    await assertPackagesAreOnCellar(version);
  }
  else {
    await publishCellar(version);
  }

  for (const target of job.targets) {
    await PUBLISHERS[target](version);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

//--

function assertVersionCoherence(version) {
  if (version !== pkgJson.version) {
    throw new Error(`Mismatch between version ${version} and package.json version ${pkgJson.version}`);
  }
}

function resolveTargets(requestedTargets) {
  if (requestedTargets == null || requestedTargets.length === 0) {
    return {
      cellar: true,
      targets: TARGETS,
    };
  }

  const cellar = requestedTargets.includes('cellar');

  const targets = cellar ? requestedTargets.filter((t) => t !== 'cellar') : requestedTargets;

  const unknownTargets = targets.filter((target) => !TARGETS.includes(target));
  if (unknownTargets.length > 0) {
    throw new Error(`Unknown targets: ${unknownTargets}. Possible targets are ${TARGETS}.`);
  }

  return {
    cellar,
    targets,
  };
}

async function assertPackagesAreOnCellar(version) {
  try {
    await assertRemoteFilesAreOnCellar(version);
  }
  catch (e) {
    throw new Error(`Cannot publish because some files are missing on Cellar: ${e.message}`);
  }
}
