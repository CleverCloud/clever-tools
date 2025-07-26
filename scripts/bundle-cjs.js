#!/usr/bin/env node
//
// Bundle the application into a single CommonJS file.
//
// This script creates a self-contained CJS bundle from the application source,
// which is used as input for binary compilation.
//
// USAGE: bundle-cjs.js <version>
//
// ARGUMENTS:
//   version         Version string (e.g., "1.2.3")
//
// REQUIRED SYSTEM BINARIES:
//   npx             For running bundling tools
//
// EXAMPLES:
//   bundle-cjs.js 1.2.3

import { bundleToSingleCjs } from './lib/bundle-cjs.js';
import { ArgumentError, runCommand } from './lib/command.js';
import { getVersion } from './lib/utils.js';

runCommand(async () => {
  const [rawVersion] = process.argv.slice(2);
  if (rawVersion == null) {
    throw new ArgumentError('version');
  }

  const version = getVersion(rawVersion);

  await bundleToSingleCjs(version);
});
