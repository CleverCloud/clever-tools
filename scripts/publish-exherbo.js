import * as cfg from './config.js';
import del from 'del';
import { cloneGitProject, applyOneTemplate, commitAndPush } from './utils';

export async function publishExherbo (version) {

  const templateFilepath = 'templates/exherbo/clever-tools-bin.exheres-0';
  const gitPath = './git-exherbo';
  const gitCleverToolsDir = `${gitPath}/packages/dev-util/clever-tools-bin`;
  const { git, appInfos } = cfg;
  const gitUrl = 'ssh://git@github.com/CleverCloud/CleverCloud-exheres.git';

  await cloneGitProject({ gitUrl, gitPath, git, cleanRepo: false });

  del.sync(`${gitCleverToolsDir}/*`);

  await applyOneTemplate(`${gitCleverToolsDir}/clever-tools-bin-${version}.exheres-0`, templateFilepath, {
    copyrightYear: new Date().getFullYear(),
    maintainerEmail: git.email,
    ...appInfos,
  });

  await commitAndPush({
    gitPath,
    version,
    commitMessage: `dev-util/clever-tools-bin: bump to ${version}`,
  });
};
