#!/usr/bin/env node
//
// Build platform-specific binary from bundled CommonJS.
//
// This script compiles the bundled CJS file into a native executable
// for the current platform using @yao-pkg/pkg.
//
// USAGE: build-binary.js <version>
//
// ARGUMENTS:
//   version         Version string (e.g., "1.2.3")
//
// EXAMPLES:
//   build-binary.js 1.2.3

import { buildBinary } from './lib/build-binary.js';
import { ArgumentError, runCommand } from './lib/command.js';
import { getOs } from './lib/platform-os.js';
import { getVersion } from './lib/utils.js';

runCommand(async () => {
  const [rawVersion] = process.argv.slice(2);
  if (rawVersion == null) {
    throw new ArgumentError('version');
  }

  const version = getVersion(rawVersion);
  const os = getOs();

  await buildBinary(version, os);
});
