import { cfg } from './config';
import fs from 'fs-extra';
import { cloneGitProject, applyTemplates, commitAndPush } from './utils';
import { getArchiveFilepath, getShaFilepath } from './paths.js';

export async function publishArch (version) {

  const templatesPath = './templates/arch';
  const gitPath = './git-arch';
  const { git, appInfos } = cfg;
  const pkgbase = 'clever-tools-bin';
  const gitUrl = `ssh://aur@aur.archlinux.org/${pkgbase}.git`;
  const shaFilepath = getShaFilepath(getArchiveFilepath('linux', version));
  const sha256 = await fs.readFile(shaFilepath, 'utf-8');

  await cloneGitProject({ gitUrl, gitPath, git });
  await applyTemplates(gitPath, templatesPath, {
    pkgbase,
    version,
    sha256,
    ...appInfos,
  });
  await commitAndPush({ gitPath, version });
};
