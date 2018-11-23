'use strict';

const cfg = require('./config');
const { cloneGitProject, applyOneTemplate, tagAndPush, commitAndPush } = require('./utils');

async function run () {

  const templateFilepath = './templates/dockerhub/Dockerfile';
  const gitPath = './git-dockerhub';
  const { git, appInfos } = cfg;
  const gitUrl = `ssh://git@github.com/CleverCloud/clever-tools-dockerhub.git`;
  const version = cfg.getVersion();

  await cloneGitProject({ gitUrl, gitPath, git });
  await applyOneTemplate(`${gitPath}/Dockerfile`, templateFilepath, {
    version,
    ...appInfos,
  });
  await commitAndPush({ gitPath, version });
  await tagAndPush({ gitPath, tagName: version });
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
