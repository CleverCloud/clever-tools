'use strict';

const cfg = require('./config');
const del = require('del');
const { cloneGitProject, applyOneTemplate, commitAndPush } = require('./utils');

async function run () {

  const templateFilepath = 'templates/exherbo/clever-tools-bin.exheres-0';
  const gitPath = './git-exherbo';
  const gitCleverToolsDir = `${gitPath}/packages/dev-util/clever-tools-bin`;
  const { git, appInfos } = cfg;
  const isStableVersion = cfg.isStableVersion();
  const gitUrl = 'ssh://git@github.com/CleverCloud/CleverCloud-exheres.git';
  const version = cfg.getVersion();
  const underscoreVersion = version
    .replace(/-/g, '_')
    .replace('beta.', 'beta');

  await cloneGitProject({ gitUrl, gitPath, git, cleanRepo: false });

  if (isStableVersion) {
    del.sync(`${gitCleverToolsDir}/*`);
  }
  else {
    del.sync(`${gitCleverToolsDir}/*beta*`);
  }
  await applyOneTemplate(`${gitCleverToolsDir}/clever-tools-bin-${underscoreVersion}.exheres-0`, templateFilepath, {
    copyrightYear: new Date().getFullYear(),
    maintainerEmail: git.email,
    ...appInfos,
  });

  await commitAndPush({
    gitPath,
    version,
    commitMessage: `dev-util/clever-tools-bin: bump to ${underscoreVersion}`,
  });
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
