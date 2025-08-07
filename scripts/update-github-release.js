#!/usr/bin/env node
//
// Upload build artifacts to GitHub release.
//
// This script uploads various build artifacts (archives, RPM, DEB packages)
// to an existing GitHub release using the gh CLI tool.
//
// USAGE: update-github-release.js <version>
//
// ARGUMENTS:
//   version         Version string (e.g., "1.2.3")
//
// ENVIRONMENT VARIABLES:
//   GITHUB_TOKEN    GitHub access token for authentication
//
// REQUIRED SYSTEM BINARIES:
//   gh              GitHub CLI tool
//
// EXAMPLES:
//   update-github-release.js 1.2.3

import { ArgumentError, readEnvVars, runCommand } from './lib/command.js';
import { getAssetPath } from './lib/paths.js';
import { exec } from './lib/process.js';
import { highlight } from './lib/terminal.js';

runCommand(async () => {
  // Don't get the value, just make sure it's here for gh
  readEnvVars(['GITHUB_TOKEN']);

  const [version] = process.argv.slice(2);
  if (version == null) {
    throw new ArgumentError('version');
  }

  console.log(highlight`=> Uploading artifacts to GitHub release ${version}`);

  const artifacts = [
    getAssetPath('archive', version, 'build', 'linux'),
    getAssetPath('archive', version, 'build', 'macos'),
    getAssetPath('archive', version, 'build', 'win'),
    getAssetPath('deb', version, 'build'),
    getAssetPath('rpm', version, 'build'),
  ];

  await Promise.all(
    artifacts.map(async (artifact) => {
      console.log(highlight`=> Upload ${artifact}`);
      await exec(`gh release upload "${version}" "${artifact}"`);
    }),
  );

  console.log(highlight`=> Successfully uploaded all artifacts to release ${version}`);
});
