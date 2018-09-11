'use strict';

const cfg = require('./config');
const fs = require('fs-extra');
const { cloneGitProject, applyTemplates, commitAndPush } = require('./utils');

async function run () {

  const templatesPath = './templates/arch';
  const gitPath = './git-arch';
  const { git, appInfos } = cfg;
  const isStableVersion = cfg.isStableVersion();
  const pkgbase = isStableVersion ? 'clever-tools-bin' : 'clever-tools-bin-beta';
  const gitUrl = `ssh://aur@aur.archlinux.org/${pkgbase}.git`;
  const version = cfg.getVersion();
  const underscoreVersion = version.replace(/-/g, '_');
  const archivePath = cfg.getArchiveFilepath('linux', version);
  const sha256 = await fs.readFile(`${archivePath}.sha256`, 'utf-8');

  await cloneGitProject({ gitUrl, gitPath, git });
  await applyTemplates(gitPath, templatesPath, {
    pkgbase,
    pkgver: underscoreVersion,
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
