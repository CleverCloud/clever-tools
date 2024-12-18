#!/usr/bin/env node

import { build } from './build.js';
import { archive } from './archive.js';
import { bundle } from './bundle.js';
import { cleanupDirectory } from './utils.js';
import { getWorkingDirectory } from './paths.js';

async function run () {
  const [versionArg, ...optionsArgs] = process.argv.slice(2);

  if (versionArg == null || versionArg.length === 0) {
    throw new Error('Missing argument \'version\'');
  }

  const version = getVersion(versionArg);
  const options = resolveOptions(optionsArgs);

  await cleanupDirectory(getWorkingDirectory(version));

  await build(version);

  if (options.archive) {
    await archive(version, options.latest);
  }
  if (options.bundle) {
    await bundle(version);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

function getVersion (version) {
  return version.replace(/\//g, '-');
}

function resolveOptions (args) {
  const options = {
    archive: false,
    latest: false,
    bundle: false,
  };

  if (args.includes('--archive') || args.includes('-a')) {
    options.archive = true;
  }

  if (args.includes('--latest') || args.includes('-l')) {
    options.archive = true;
    options.latest = true;
  }

  if (args.includes('--bundle') || args.includes('-b')) {
    options.archive = true;
    options.bundle = true;
  }

  return options;
}
