#!/usr/bin/env node
//
// Publish a new version to Arch User Repository (AUR).
//
// This script updates the PKGBUILD and .SRCINFO files of an AUR package with new
// version information and checksums, and commits the changes to the AUR repository.
//
// Two flavors are published, from two distinct AUR repositories:
//   bin     "clever-tools-bin", the self contained binary, built from the Linux archive
//   nodejs  "clever-tools", the Node.js flavor, built from the npm registry tarball
//
// USAGE: publish-aur.js <version> <flavor>
//
// ARGUMENTS:
//   version         Version string (e.g., "1.2.3")
//   flavor          Package flavor ('bin' or 'nodejs')
//
// ENVIRONMENT VARIABLES:
//   AUR_GIT_URL     AUR repository URL of the given flavor
//
// REQUIRED SYSTEM BINARIES:
//   git             For cloning, committing, and pushing to AUR repository
//
// EXAMPLES:
//   publish-aur.js 1.2.3 bin
//   publish-aur.js 1.2.3 nodejs

import { simpleGit } from 'simple-git';
import pkg from '../package.json' with { type: 'json' };
import { ArgumentError, readEnvVars, runCommand } from './lib/command.js';
import { getSha256, getSha512 } from './lib/fs.js';
import { commitAndPush } from './lib/git.js';
import { getNpmTarballSha512 } from './lib/npm-registry.js';
import { getAssetPath } from './lib/paths.js';
import { applyTemplates } from './lib/templates.js';
import { highlight } from './lib/terminal.js';

const VALID_FLAVORS = ['bin', 'nodejs'];
/** @type {Record<string, string>} */
const PKGBASES = { bin: 'clever-tools-bin', nodejs: 'clever-tools' };
/** @type {Record<string, string>} */
const FLAVOR_LABELS = { bin: 'standalone binary', nodejs: 'Node.js' };
const LOCKFILE_PATH = './package-lock.json';
const TEMPLATES_PATH = './scripts/templates/aur';
const GIT_PATH = './git-aur';

runCommand(async () => {
  const [version, flavor] = process.argv.slice(2);
  if (version == null) {
    throw new ArgumentError('version');
  }
  if (flavor == null || !VALID_FLAVORS.includes(flavor)) {
    throw new ArgumentError('flavor', VALID_FLAVORS);
  }

  const [gitUrl] = readEnvVars(['AUR_GIT_URL']);

  const checksums = await getChecksums(version, flavor);

  console.log(highlight`=> Cloning AUR repository ${gitUrl} to ${GIT_PATH}`);
  await simpleGit().clone(gitUrl, GIT_PATH);

  await applyTemplates(GIT_PATH, `${TEMPLATES_PATH}/${flavor}`, {
    description: `${pkg.description} (${FLAVOR_LABELS[flavor]})`,
    license: pkg.license,
    maintainer: pkg.author,
    pkgbase: PKGBASES[flavor],
    url: pkg.homepage,
    version,
    ...checksums,
  });

  await commitAndPush(GIT_PATH, gitUrl, pkg.author, version);
});

/**
 * Computes the source checksums required by the templates of the given flavor.
 *
 * The "bin" flavor hashes the Linux archive built by the pipeline, the "nodejs" flavor
 * hashes the npm registry tarball and the lockfile that pins its dependency tree.
 *
 * @param {string} version - The version to publish
 * @param {string} flavor - The package flavor ('bin' or 'nodejs')
 * @returns {Promise<Record<string, string>>} The template variables holding the checksums
 */
async function getChecksums(version, flavor) {
  switch (flavor) {
    case 'bin': {
      const archivePath = getAssetPath('archive', version, 'build', 'linux');
      return { sha256: await getSha256(archivePath) };
    }
    case 'nodejs': {
      // The lockfile is not part of the published npm tarball, the PKGBUILD downloads it
      // from the matching git tag: the file we hash here is the one served by that tag.
      return {
        tarballSha512: await getNpmTarballSha512(pkg.name, version),
        lockfileSha512: await getSha512(LOCKFILE_PATH),
      };
    }
    default:
      throw new ArgumentError('flavor', VALID_FLAVORS);
  }
}
