#!/usr/bin/env node
//
// Bundle the application into a single CommonJS file.
//
// This script creates a self-contained CJS bundle from the application source,
// which is used as input for binary compilation.
//
// USAGE: bundle-cjs.js <version> <isPreview>
//
// ARGUMENTS:
//   version         Version string (e.g., "1.2.3")
//   isPreview       Whether this is a preview build (true/false)
//
// REQUIRED SYSTEM BINARIES:
//   npx             For running bundling tools
//
// EXAMPLES:
//   bundle-cjs.js 1.2.3 false
//   bundle-cjs.js preview-feature true

import { bundleToSingleCjs } from './lib/bundle-cjs.js';
import { ArgumentError, runCommand } from './lib/command.js';
import { getVersion } from './lib/utils.js';

runCommand(async () => {
  const [rawVersion, rawIsPreview] = process.argv.slice(2);
  if (rawVersion == null) {
    throw new ArgumentError('version');
  }
  if (rawIsPreview == null) {
    throw new ArgumentError('isPreview');
  }

  const version = getVersion(rawVersion);
  const isPreview = rawIsPreview === 'true';

  await bundleToSingleCjs(version, isPreview);
});
