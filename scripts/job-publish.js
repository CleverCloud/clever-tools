#!/usr/bin/env node

import { getPackageJson } from '../src/load-package-json.cjs';
import * as publishArch from './publish-arch.js';
import * as publishBrew from './publish-brew.js';
import { publishCellar, assertRemoteFilesAreOnCellar } from './publish-cellar.js';
import * as publishDockerhub from './publish-dockerhub.js';
import * as publishExherbo from './publish-exherbo.js';
import * as publishNexus from './publish-nexus.js';
import * as publishNpm from './publish-npm.js';

const pkgJson = getPackageJson();

const PUBLISHERS = {
  arch: publishArch,
  brew: publishBrew,
  dockerhub: publishDockerhub,
  exherbo: publishExherbo,
  nexus: publishNexus,
  npm: publishNpm,
};
const TARGETS = Object.keys(PUBLISHERS);

async function run () {
  const [version, ...requestedTargets] = process.argv.slice(2);

  if (version == null || version.length === 0) {
    throw new Error('Missing argument \'version\'');
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

// --

function assertVersionCoherence (version) {
  if (version !== pkgJson.version) {
    throw new Error(`Mismatch between version ${version} and package.json version ${pkgJson.version}`);
  }
}

function resolveTargets (requestedTargets) {
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

async function assertPackagesAreOnCellar (version) {
  try {
    await assertRemoteFilesAreOnCellar(version);
  }
  catch (e) {
    throw new Error(`Cannot publish because some files are missing on Cellar: ${e.message}`);
  }
}
