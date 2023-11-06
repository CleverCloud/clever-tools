'use strict';

const cfg = require('./config');
const { cloneGitProject, applyTemplates, tagAndPush, commitAndPush } = require('./utils');

module.exports = async function publishDockerhub (version) {

  const templateFilepath = './templates/dockerhub';
  const gitPath = './git-dockerhub';
  const { git, appInfos } = cfg;
  const gitUrl = 'ssh://git@github.com/CleverCloud/clever-tools-dockerhub.git';

  await cloneGitProject({ gitUrl, gitPath, git });
  await applyTemplates(gitPath, templateFilepath, {
    version,
    ...appInfos,
  });
  await commitAndPush({ gitPath, version });
  await tagAndPush({ gitPath, tagName: version });
}
