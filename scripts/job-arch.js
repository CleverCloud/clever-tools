'use strict';

const _ = require('lodash');
const cfg = require('./config');
const fs = require('fs-extra');
const glob = require('glob');
const { exec } = require('./utils');

// This disables ES6+ template delimiters
_.templateSettings.interpolate = /<%=([\s\S]+?)%>/g;

async function run () {

  const templatesPath = './templates/arch';
  const gitPath = './git-arch';
  const { git, appInfos } = cfg;
  const isStableVersion = cfg.isStableVersion();
  const pkgbase = isStableVersion ? 'clever-tools-bin' : 'clever-tools-bin-beta';
  const gitUrl = `ssh://aur@aur.archlinux.org/${pkgbase}.git`;
  const version = cfg.getVersion();
  const underscoreVersion = version.replace(/-/g, '_');
  const archivePath = cfg.getArchiveFilepath('linux');
  const sha256 = await fs.readFile(`${archivePath}.sha256`, 'utf-8');

  await exec(`mkdir -p ~/.ssh`);
  await exec(`ssh-keyscan -t rsa aur.archlinux.org >> ~/.ssh/known_hosts`);

  await exec(`git clone ${gitUrl} ${gitPath}`);
  await exec(`git config user.email "${git.email}"`, gitPath);
  await exec(`git config user.name "${git.name}"`, gitPath);
  await exec(`git ls-files -z | xargs -0 rm -f`, gitPath);

  const filenames = glob.sync(`**/*`, { dot: true, nodir: true, cwd: templatesPath });
  for (let file of filenames) {
    const template = await fs.readFile(`${templatesPath}/${file}`, 'utf-8');
    const contents = _.template(template)({
      pkgbase,
      pkgver: underscoreVersion,
      version,
      sha256,
      ...appInfos,
    });
    await fs.ensureFile(`${gitPath}/${file}`);
    await fs.writeFile(`${gitPath}/${file}`, contents);
  }

  await exec(`git add *`, gitPath);
  await exec(`git commit -m "Update to ${version}"`, gitPath);
  await exec(`git push origin master`, gitPath);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
