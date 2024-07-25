import os from 'os';
import { getPackageJson } from '../src/load-package-json.js';
const pkg = getPackageJson();

export const archList = ['linux', 'macos', 'win'];
export const archEmoji = {
  linux: '🐧',
  macos: '🍏',
  win: '🪟',
};
export const nodeVersion = pkg['pkg-node-version'];
export const git = {
  email: 'ci@clever-cloud.com',
  name: 'Clever Cloud CI',
};
export const appInfos = {
  name: pkg.name,
  vendor: 'Clever Cloud',
  url: pkg.homepage,
  description: pkg.description,
  license: pkg.license,
  maintainer: `${git.name} <${git.email}>`,
  keywords: pkg.keywords.join(' '),
};

export function getNexusAuth () {
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

export function getNpmToken () {
  const token = process.env.NPM_TOKEN;
  if (!token) {
    throw new Error('Could not read NPM token!');
  }
  return token;
}

export function getDockerHubConf () {
  const username = process.env.DOCKERHUB_USERNAME;
  const token = process.env.DOCKERHUB_TOKEN;
  if (username == null || token == null) {
    throw new Error('Could not read DockerHub credentials!');
  }
  return { username, token, imageName: 'clevercloud/clever-tools' };
}

export function getGpgConf () {
  const gpgPrivateKey = process.env.RPM_GPG_PRIVATE_KEY;
  const gpgPath = process.env.RPM_GPG_PATH || os.homedir();
  const gpgName = process.env.RPM_GPG_NAME;
  const gpgPass = process.env.RPM_GPG_PASS;
  return { gpgPrivateKey, gpgPath, gpgName, gpgPass };
}

export function getCellarConf (scope) {
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
