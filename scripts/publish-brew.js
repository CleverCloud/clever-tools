import * as cfg from './config.js';
import fs from 'fs-extra';
import { cloneGitProject, applyTemplates, commitAndPush } from './utils';
import { getShaFilepath, getArchiveFilepath } from './paths.js';

export async function publishBrew (version) {

  const templatesPath = './templates/brew';
  const gitPath = './git-brew';
  const { git, appInfos } = cfg;
  const gitProject = 'homebrew-tap';
  const gitUrl = `ssh://git@github.com/CleverCloud/${gitProject}.git`;
  const shaFilepath = getShaFilepath(getArchiveFilepath('macos', version));
  const sha256 = await fs.readFile(shaFilepath, 'utf-8');

  await cloneGitProject({ gitUrl, gitPath, git });
  await applyTemplates(gitPath, templatesPath, {
    gitProject,
    version,
    sha256,
    ...appInfos,
  });
  await commitAndPush({ gitPath, version });
};
