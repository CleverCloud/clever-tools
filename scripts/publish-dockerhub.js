import * as cfg from './config.js';
import { cloneGitProject, applyTemplates, tagAndPush, commitAndPush, execSync } from './utils';
import childProcess from 'node:child_process';

export async function publishDockerhub (version) {

  const dockerHubConf = cfg.getDockerHubConf();
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

  execSync(`docker build -t ${dockerHubConf.imageName}:latest -t ${dockerHubConf.imageName}:${version} .`, gitPath);
  childProcess.execSync(`docker login -u ${dockerHubConf.username} --password-stdin`, { input: dockerHubConf.token });
  execSync(`docker push -a ${dockerHubConf.imageName}`);
  execSync('docker logout');
};
