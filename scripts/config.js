'use strict';

const os = require('os');
const pkgJson = require('../package.json');

const archList = ['linux', 'macos', 'win'];
const archEmoji = {
  linux: '🐧',
  macos: '🍏',
  win: '🪟',
};
const nodeVersion = pkgJson['pkg-node-version'];
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

function getNexusAuth () {
  const user = process.env.NEXUS_USER || 'ci';
  const password = process.env.NEXUS_PASSWORD;
  const nugetApiKey = process.env.NUGET_API_KEY;
  if (user == null || password == null) {
    throw new Error('Could not read Nexus credentials!');
  }
  if (nugetApiKey == null) {
    throw new Error('Could not read Nexus Nuget API key!');
  }
  return { user, password, nugetApiKey };
}

function getNpmToken () {
  const token = process.env.NPM_TOKEN;
  if (!token) {
    throw new Error('Could not read NPM token!');
  }
  return token;
}

function getGpgConf () {
  const gpgPrivateKey = process.env.RPM_GPG_PRIVATE_KEY;
  const gpgPath = process.env.RPM_GPG_PATH || os.homedir();
  const gpgName = process.env.RPM_GPG_NAME;
  const gpgPass = process.env.RPM_GPG_PASS;
  return { gpgPrivateKey, gpgPath, gpgName, gpgPass };
}

function getCellarConf (scope) {
  if (scope === 'previews') {
    return {
      host: 'cellar-c2.services.clever-cloud.com',
      bucket: 'clever-tools-preview.clever-cloud.com',
      accessKeyId: process.env.CC_CLEVER_TOOLS_PREVIEWS_CELLAR_KEY_ID,
      secretAccessKey: process.env.CC_CLEVER_TOOLS_PREVIEWS_CELLAR_SECRET_KEY,
    };
  }
  if (scope === 'releases') {
    return {
      host: 'cellar-c2.services.clever-cloud.com',
      bucket: 'clever-tools.clever-cloud.com',
      accessKeyId: process.env.CC_CLEVER_TOOLS_RELEASES_CELLAR_KEY_ID,
      secretAccessKey: process.env.CC_CLEVER_TOOLS_RELEASES_CELLAR_SECRET_KEY,
    };
  }
  throw new Error(`Unsupported cellar scope "${scope}". Supported scopes: "previews", "releases".`);
}

module.exports = {
  archList,
  archEmoji,
  nodeVersion,
  git,
  appInfos,
  getNexusAuth,
  getNpmToken,
  getGpgConf,
  getCellarConf,
};
