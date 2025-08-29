#!/usr/bin/env node
//
// Publish a new version to Arch User Repository (AUR).
//
// This script updates the PKGBUILD file for the AUR package with new version
// information, calculates the SHA256 hash of the Linux archive, and commits
// the changes to the AUR repository.
//
// USAGE: publish-aur.js <version>
//
// ARGUMENTS:
//   version         Version string (e.g., "1.2.3")
//
// ENVIRONMENT VARIABLES:
//   AUR_GIT_URL     AUR repository URL
//
// REQUIRED SYSTEM BINARIES:
//   git             For cloning, committing, and pushing to AUR repository
//
// EXAMPLES:
//   publish-aur.js 1.2.3

import { simpleGit } from 'simple-git';
import pkg from '../package.json' with { type: 'json' };
import { ArgumentError, readEnvVars, runCommand } from './lib/command.js';
import { getSha256 } from './lib/fs.js';
import { commitAndPush } from './lib/git.js';
import { getAssetPath } from './lib/paths.js';
import { applyTemplates } from './lib/templates.js';
import { highlight } from './lib/terminal.js';

const PKGBASE = 'clever-tools-bin';
const TEMPLATES_PATH = './scripts/templates/aur';
const GIT_PATH = './git-aur';

runCommand(async () => {
  const [version] = process.argv.slice(2);
  if (version == null) {
    throw new ArgumentError('version');
  }

  const [gitUrl] = readEnvVars(['AUR_GIT_URL']);

  const archivePath = getAssetPath('archive', version, 'build', 'linux');
  const sha256 = await getSha256(archivePath);

  console.log(highlight`=> Cloning AUR repository ${gitUrl} to ${GIT_PATH}`);
  await simpleGit().clone(gitUrl, GIT_PATH);

  await applyTemplates(GIT_PATH, TEMPLATES_PATH, {
    description: pkg.description,
    license: pkg.license,
    maintainer: pkg.author,
    pkgbase: PKGBASE,
    sha256,
    url: pkg.homepage,
    version,
  });

  await commitAndPush(GIT_PATH, gitUrl, pkg.author, version);
});
