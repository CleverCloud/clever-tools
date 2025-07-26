#!/usr/bin/env node
//
// Publish a new version to Exherbo Linux package repository.
//
// This script creates a new exheres package file for the specified version
// and commits it to the Exherbo package repository. Exherbo uses versioned
// package files with the pattern packagename-version.exheres-0.
//
// USAGE: publish-exherbo.js <version>
//
// ARGUMENTS:
//   version         Version string (e.g., "1.2.3")
//
// ENVIRONMENT VARIABLES:
//   EXHERBO_GIT_URL         Exherbo repository URL
//
// REQUIRED SYSTEM BINARIES:
//   git             For cloning, committing, and pushing to Exherbo repository
//
// EXAMPLES:
//   publish-exherbo.js 1.2.3

import { simpleGit } from 'simple-git';
import pkg from '../package.json' with { type: 'json' };
import { ArgumentError, readEnvVars, runCommand } from './lib/command.js';
import { commitAndPush } from './lib/git.js';
import { applyOneTemplate } from './lib/templates.js';
import { highlight } from './lib/terminal.js';
import { getPackageAuthor } from './lib/utils.js';

const TEMPLATES_PATH = './scripts/templates/exherbo/clever-tools-bin.exheres-0';
const GIT_PATH = './git-exherbo';
const PACKAGE_DIR = `${GIT_PATH}/packages/dev-util/clever-tools-bin`;

runCommand(async () => {
  const [version] = process.argv.slice(2);
  if (version == null) {
    throw new ArgumentError('version');
  }

  const [gitUrl] = readEnvVars(['EXHERBO_GIT_URL']);

  console.log(highlight`=> Cloning exherbo repository ${gitUrl} to ${GIT_PATH}`);
  await simpleGit().clone(gitUrl, GIT_PATH);

  await applyOneTemplate(`${PACKAGE_DIR}/clever-tools-bin-${version}.exheres-0`, TEMPLATES_PATH, {
    copyrightYear: new Date().getFullYear().toString(),
    description: pkg.description,
    license: pkg.license,
    maintainer: getPackageAuthor().email,
    maintainerEmail: pkg.author,
  });

  await commitAndPush(GIT_PATH, gitUrl, pkg.author, version, `dev-util/clever-tools-bin: bump to ${version}`);
});
