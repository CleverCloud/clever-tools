#!/usr/bin/env node
//
// Create platform-specific archive from built binary.
//
// This script packages the compiled binary into a compressed archive
// (tar.gz for Unix-like systems, zip for Windows) ready for distribution.
//
// USAGE: create-archive.js <version> <createLatest>
//
// ARGUMENTS:
//   version         Version string (e.g., "1.2.3")
//   createLatest    Whether to create a latest build (true/false)
//
// REQUIRED SYSTEM BINARIES:
//   tar             For creating tar.gz archives (Unix-like systems)
//   zip             For creating zip archives (Windows)
//
// EXAMPLES:
//   create-archive.js 1.2.3 true
//   create-archive.js preview-branch false

import { ArgumentError, runCommand } from './lib/command.js';
import { createArchive } from './lib/create-archive.js';
import { getOs } from './lib/platform-os.js';
import { getVersion } from './lib/utils.js';

runCommand(async () => {
  const [rawVersion, rawCreateLatest] = process.argv.slice(2);
  if (rawVersion == null) {
    throw new ArgumentError('version');
  }
  if (rawCreateLatest == null) {
    throw new ArgumentError('createLatest');
  }

  const version = getVersion(rawVersion);
  const createLatest = rawCreateLatest === 'true';
  const os = getOs();

  await createArchive(version, os, createLatest);
});
