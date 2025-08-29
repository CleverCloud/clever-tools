#!/usr/bin/env node
//
// Publish a new version to Docker Hub.
//
// This script updates Docker-related files, builds Docker images for both
// the specific version and latest tag, and pushes them to Docker Hub.
// It also commits changes to the associated Git repository.
//
// USAGE: publish-dockerhub.js <version>
//
// ARGUMENTS:
//   version         Version string (e.g., "1.2.3")
//
// ENVIRONMENT VARIABLES:
//   DOCKERHUB_USERNAME                        Docker Hub username
//   DOCKERHUB_TOKEN                           Docker Hub access token
//   DOCKER_IMAGE_NAME                         Docker image name
//   DOCKERHUB_GIT_URL                         Docker repository URL
//   CC_CLEVER_TOOLS_RELEASES_CELLAR_BUCKET    Cellar bucket for release downloads
//
// REQUIRED SYSTEM BINARIES:
//   git             For cloning, committing, and pushing to Docker repository
//   docker          For building and pushing Docker images
//
// EXAMPLES:
//   publish-dockerhub.js 1.2.3

import { simpleGit } from 'simple-git';
import pkg from '../package.json' with { type: 'json' };
import { CellarClientPublic } from './lib/cellar-client-public.js';
import { ArgumentError, readEnvVars, runCommand } from './lib/command.js';
import { commitAndPush, tagAndPush } from './lib/git.js';
import { getAssetPath } from './lib/paths.js';
import { exec, execWithStdin } from './lib/process.js';
import { applyTemplates } from './lib/templates.js';
import { highlight } from './lib/terminal.js';

const TEMPLATES_PATH = './scripts/templates/dockerhub';
const GIT_PATH = './git-dockerhub';

runCommand(async () => {
  const [version] = process.argv.slice(2);
  if (version == null) {
    throw new ArgumentError('version');
  }

  const [dockerHubUser, dockerHubToken, dockerImageName, gitUrl, releaseBucket] = readEnvVars([
    'DOCKERHUB_USERNAME',
    'DOCKERHUB_TOKEN',
    'DOCKER_IMAGE_NAME',
    'DOCKERHUB_GIT_URL',
    'CC_CLEVER_TOOLS_RELEASES_CELLAR_BUCKET',
  ]);

  const releaseClient = new CellarClientPublic({
    bucket: releaseBucket,
  });
  const releasePath = getAssetPath('archive', version, 'release', 'linux');
  const downloadUrl = releaseClient.getPublicUrl(releasePath);

  console.log(highlight`=> Cloning dockerhub repository ${gitUrl} to ${GIT_PATH}`);
  await simpleGit().clone(gitUrl, GIT_PATH);

  await applyTemplates(GIT_PATH, TEMPLATES_PATH, {
    description: pkg.description,
    downloadUrl,
    license: pkg.license,
    maintainer: pkg.author,
    version,
  });

  await commitAndPush(GIT_PATH, gitUrl, pkg.author, version);
  await tagAndPush(GIT_PATH, gitUrl, version);

  await exec(`docker build -t ${dockerImageName}:latest -t ${dockerImageName}:${version} .`, { cwd: GIT_PATH });
  await execWithStdin(`docker login -u ${dockerHubUser} --password-stdin`, dockerHubToken);
  await exec(`docker push -a ${dockerImageName}`);
  await exec('docker logout');
});
