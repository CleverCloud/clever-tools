'use strict';

const pkgJson = require('../package.json');
const semver = require('semver');

const archList = ['linux', 'macos', 'win'];
const nodeVersion = process.versions.node;
const releasesDir = 'releases';
const cellar = {
  host: 'cellar.services.clever-cloud.com',
  bucket: 'clever-tools',
};
const bintray = {
  subject: 'clevercloud',
  user: 'ci-clevercloud',
};
const git = {
  email: 'ci@clever-cloud.com',
  name: 'Clever Cloud CI',
};
const appInfos = {
  name: pkgJson.name,
  vendor: 'Clever Cloud',
  url: pkgJson.homepage,
  description: pkgJson.description,
  license: pkgJson.license,
  maintainer: `${git.name} <${git.email}>`,
  keywords: pkgJson.keywords.join(' '),
};

function getVersion (striclyFromTag = false) {
  const gitTag = process.env.GIT_TAG_NAME;
  if (!gitTag) {
    if (striclyFromTag) {
      throw new Error('Could not read version from git tag!');
    }
    return process.env.GIT_BRANCH;
  }
  const gitTagVersion = gitTag.trim();
  if (gitTagVersion !== pkgJson.version) {
    throw new Error(`Mismatch between git tag ${gitTagVersion} and package.json version ${pkgJson.version}`);
  }
  return gitTagVersion;
}

function isStableVersion () {
  const version = getVersion(true);
  return semver.prerelease(version).length === 0;
}

function getBinaryFilename (arch) {
  return (arch === 'win') ? `clever.exe` : 'clever';
}

function getBinaryFilepath (arch) {
  const version = getVersion();
  const filename = getBinaryFilename(arch);
  return `${releasesDir}/${version}/${arch}/${filename}`;
}

function getArchiveFilepath (arch) {
  const version = getVersion();
  const archiveExt = (arch === 'win') ? '.zip' : '.tar.gz';
  return `${releasesDir}/${version}/${appInfos.name}-${version}_${arch}${archiveExt}`;
}

function getBundleFilepath (type) {
  const rawVersion = getVersion();
  const nameVersionDelimiter = (type === 'nupkg') ? '.' : '-';
  const version = (type === 'nupkg') ? rawVersion.replace('beta.', 'beta') : rawVersion;
  return `${releasesDir}/${rawVersion}/${appInfos.name}${nameVersionDelimiter}${version}.${type}`;
}

function getBintrayApiKey () {
  const apiKey = process.env.BINTRAY_API_KEY;
  if (!apiKey) {
    throw new Error('Could not read bintray API key!');
  }
  return apiKey;
}

function getNpmToken () {
  const token = process.env.NPM_TOKEN;
  if (!token) {
    throw new Error('Could not read NPM token!');
  }
  return token;
}

module.exports = {
  archList,
  nodeVersion,
  releasesDir,
  cellar,
  bintray,
  git,
  appInfos,
  getVersion,
  isStableVersion,
  getBinaryFilepath,
  getArchiveFilepath,
  getBundleFilepath,
  getBintrayApiKey,
  getNpmToken,
};
