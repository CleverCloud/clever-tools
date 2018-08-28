'use strict';

const _ = require('lodash');
const cfg = require('./config');
const fs = require('fs-extra');
const glob = require('glob');
const { exec } = require('./utils');

// This disables ES6+ template delimiters
_.templateSettings.interpolate = /<%=([\s\S]+?)%>/g;

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

  await exec(`mkdir -p ~/.ssh`);
  await exec(`ssh-keyscan -t rsa github.com >> ~/.ssh/known_hosts`);

  await exec(`git clone ${gitUrl} ${gitPath}`);
  await exec(`git config user.email "${git.email}"`, gitPath);
  await exec(`git config user.name "${git.name}"`, gitPath);
  await exec(`git ls-files -z | xargs -0 rm -f`, gitPath);

  const filenames = glob.sync(`**/*`, { dot: true, nodir: true, cwd: templatesPath });
  for (let file of filenames) {
    const template = await fs.readFile(`${templatesPath}/${file}`, 'utf-8');
    const contents = _.template(template)({
      gitProject,
      version,
      sha256,
      ...appInfos,
    });
    await fs.ensureFile(`${gitPath}/${file}`);
    await fs.writeFile(`${gitPath}/${file}`, contents);
  }

  await exec(`git add -A`, gitPath);
  await exec(`git commit -m "Update to ${version}"`, gitPath);
  await exec(`git push origin master`, gitPath);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
