'use strict';

const cfg = require('./config');
const fs = require('fs-extra');
const { cloneGitProject, applyTemplates, commitAndPush } = require('./utils');

async function run () {

  const templatesPath = './templates/brew';
  const gitPath = './git-brew';
  const { git, appInfos } = cfg;
  const isStableVersion = cfg.isStableVersion();
  const gitProject = isStableVersion ? 'homebrew-tap' : 'homebrew-tap-beta';
  const gitUrl = `git@github.com:CleverCloud/${gitProject}.git`;
  const version = cfg.getVersion();
  const archivePath = cfg.getArchiveFilepath('macos');
  const sha256 = await fs.readFile(`${archivePath}.sha256`, 'utf-8');

  await cloneGitProject({ gitUrl, gitPath, git });
  await applyTemplates(gitPath, templatesPath, {
    gitProject,
    version,
    sha256,
    ...appInfos,
  });
  await commitAndPush({ gitPath, version });
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
