'use strict';

const _ = require('lodash');
const childProcess = require('child_process');
const fs = require('fs-extra');
const glob = require('glob');
const { URL } = require('url');

// This disables ES6+ template delimiters
_.templateSettings.interpolate = /<%=([\s\S]+?)%>/g;

function exec (command, cwd) {
  console.log(`Executing command: ${command}`);
  return new Promise((resolve, reject) => {
    childProcess.exec(command, { cwd }, (err, stdout, stderr) => {
      if (err) {
        console.error(stderr);
        return reject(err);
      }
      console.log(stdout);
      return resolve();
    });
  });
}

async function cloneGitProject ({ gitUrl, gitPath, git, cleanRepo = true }) {
  const { protocol, hostname } = new URL(gitUrl);
  if (protocol === 'ssh:') {
    await exec(`mkdir -p ~/.ssh`);
    await exec(`ssh-keyscan -t rsa ${hostname} >> ~/.ssh/known_hosts`);
  }
  await exec(`git clone ${gitUrl} ${gitPath}`);
  await exec(`git config user.email "${git.email}"`, gitPath);
  await exec(`git config user.name "${git.name}"`, gitPath);
  if (cleanRepo) {
    await exec(`git ls-files -z | xargs -0 rm -f`, gitPath);
  }
}

async function applyTemplates (destPath, templatesPath, templateData) {
  const filenames = glob.sync(`**/*`, { dot: true, nodir: true, cwd: templatesPath });
  for (const file of filenames) {
    const templateFilepath = `${templatesPath}/${file}`;
    const destFilepath = `${destPath}/${file}`;
    await applyOneTemplate(destFilepath, templateFilepath, templateData);
  }
}

async function applyOneTemplate (destFilepath, templateFilepath, templateData) {
  const template = await fs.readFile(templateFilepath, 'utf-8');
  const contents = _.template(template)(templateData);
  await fs.ensureFile(destFilepath);
  await fs.writeFile(destFilepath, contents);
}

async function commitAndPush ({ gitPath, version, commitMessage = `Update to ${version}` }) {
  await exec(`git add -A`, gitPath);
  await exec(`git status`, gitPath);
  await exec(`git commit -m "${commitMessage}"`, gitPath);
  await exec(`git push origin master`, gitPath);
}

async function tagAndPush ({ gitPath, tagName }) {
  await exec(`git tag ${tagName}`, gitPath);
  await exec(`git push origin refs/tags/${tagName}`, gitPath);
}

module.exports = { exec, cloneGitProject, applyTemplates, applyOneTemplate, tagAndPush, commitAndPush };
