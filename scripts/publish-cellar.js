#!/usr/bin/env node
//
// Publish build artifacts to Clever Cloud's Cellar storage.
//
// This script uploads various types of build artifacts (archives, RPM, DEB packages)
// to Cellar S3-compatible object storage for distribution and releases.
//
// USAGE: publish-cellar.js <version> <artifact>
//
// ARGUMENTS:
//   version         Version string (e.g., "1.2.3")
//   artifact        Type of artifact to upload ('archives', 'rpm', or 'deb')
//
// ENVIRONMENT VARIABLES:
//   CC_CLEVER_TOOLS_RELEASES_CELLAR_BUCKET      Cellar bucket name
//   CC_CLEVER_TOOLS_RELEASES_CELLAR_KEY_ID      Cellar access key ID
//   CC_CLEVER_TOOLS_RELEASES_CELLAR_SECRET_KEY  Cellar secret key
//
// REQUIRED SYSTEM BINARIES:
//
// EXAMPLES:
//   publish-cellar.js 1.2.3 archives
//   publish-cellar.js 1.2.3 rpm
//   publish-cellar.js 1.2.3 deb

import { CellarClient } from './lib/cellar-client.js';
import { ArgumentError, readEnvVars, runCommand } from './lib/command.js';
import { getAssetPath } from './lib/paths.js';
import { highlight } from './lib/terminal.js';

/**
 * @typedef {import('./lib/common.types.js').OS} OS
 */

const VALID_ARTIFACTS = ['archives', 'rpm', 'deb'];

runCommand(async () => {
  const [bucket, accessKeyId, secretAccessKey] = readEnvVars([
    'CC_CLEVER_TOOLS_RELEASES_CELLAR_BUCKET',
    'CC_CLEVER_TOOLS_RELEASES_CELLAR_KEY_ID',
    'CC_CLEVER_TOOLS_RELEASES_CELLAR_SECRET_KEY',
  ]);

  const cellarClient = new CellarClient({
    bucket,
    accessKeyId,
    secretAccessKey,
  });

  const [version, artifact] = process.argv.slice(2);
  if (version == null) {
    throw new ArgumentError('version');
  }
  if (artifact == null || !VALID_ARTIFACTS.includes(artifact)) {
    throw new ArgumentError('artifact', VALID_ARTIFACTS);
  }

  switch (artifact) {
    case 'archives':
      await Promise.all([
        uploadArtifact(cellarClient, 'archive', version, 'linux'),
        uploadArtifact(cellarClient, 'archive', version, 'macos'),
        uploadArtifact(cellarClient, 'archive', version, 'win'),
      ]);
      break;
    case 'rpm':
      await uploadArtifact(cellarClient, 'rpm', version);
      break;
    case 'deb':
      await uploadArtifact(cellarClient, 'deb', version);
      break;
  }
});

/**
 * Uploads an artifact to both versioned and latest paths in Cellar storage
 * @param {CellarClient} cellarClient - The Cellar client instance
 * @param {'bundle'|'binary'|'archive'|'rpm'|'deb'} type - Asset type
 * @param {string} version - The version string
 * @param {OS} [os] - Operating system (required for binary/archive)
 */
async function uploadArtifact(cellarClient, type, version, os) {
  const localPath = getAssetPath(type, version, 'build', os);
  const remotePath = getAssetPath(type, version, 'release', os);
  const latestRemotePath = getAssetPath(type, 'latest', 'release', os);

  console.log(highlight`=> Upload ${localPath} to ${remotePath}`);
  console.log(highlight`=> Upload ${localPath} to ${latestRemotePath}`);
  await Promise.all([cellarClient.upload(localPath, remotePath), cellarClient.upload(localPath, latestRemotePath)]);
}
