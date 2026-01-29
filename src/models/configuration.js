import path from 'node:path';
import xdg from 'xdg';
import { readJson, writeJson } from '../lib/fs.js';
import { Logger } from '../logger.js';

const CONFIG_FILES = {
  MAIN: 'clever-tools.json',
  IDS_CACHE: 'ids-cache.json',
  EXPERIMENTAL_FEATURES_FILE: 'clever-tools-experimental-features.json',
};

function getConfigDir() {
  return process.platform === 'win32'
    ? path.resolve(process.env.APPDATA, 'clever-cloud')
    : xdg.basedir.configPath('clever-cloud');
}

function getConfigPath(configFile) {
  return path.resolve(getConfigDir(), configFile);
}

export async function loadOAuthConf() {
  Logger.debug('Load configuration from environment variables');
  if (process.env.CLEVER_TOKEN != null && process.env.CLEVER_SECRET != null) {
    return {
      source: 'environment variables',
      token: process.env.CLEVER_TOKEN,
      secret: process.env.CLEVER_SECRET,
    };
  }
  Logger.debug('Load configuration from ' + conf.CONFIGURATION_FILE);
  try {
    const { token, secret } = await readJson(conf.CONFIGURATION_FILE);
    return {
      source: 'configuration file',
      token,
      secret,
    };
  } catch (error) {
    Logger.info(`Cannot load configuration from ${conf.CONFIGURATION_FILE}\n${error.message}`);
    return {
      source: 'none',
    };
  }
}

export async function writeOAuthConf(oauthData) {
  Logger.debug('Write the tokens in the configuration file…');
  try {
    await writeJson(conf.CONFIGURATION_FILE, oauthData);
  } catch (error) {
    throw new Error(`Cannot write configuration to ${conf.CONFIGURATION_FILE}\n${error.message}`);
  }
}

export async function loadIdsCache() {
  const cachePath = getConfigPath(CONFIG_FILES.IDS_CACHE);
  try {
    return readJson(cachePath);
  } catch (error) {
    Logger.info(`Cannot load IDs cache from ${cachePath}\n${error.message}`);
    return {
      owners: {},
      addons: {},
    };
  }
}

export async function writeIdsCache(ids) {
  const cachePath = getConfigPath(CONFIG_FILES.IDS_CACHE);
  try {
    await writeJson(cachePath, ids);
  } catch (error) {
    throw new Error(`Cannot write IDs cache to ${cachePath}\n${error.message}`);
  }
}

export async function getFeatures() {
  Logger.debug('Get features configuration from ' + conf.EXPERIMENTAL_FEATURES_FILE);
  try {
    return readJson(conf.EXPERIMENTAL_FEATURES_FILE);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw new Error(`Cannot get experimental features configuration from ${conf.EXPERIMENTAL_FEATURES_FILE}`);
    }
    return {};
  }
}

export async function setFeature(feature, value) {
  const currentFeatures = await getFeatures();
  const newFeatures = { ...currentFeatures, ...{ [feature]: value } };

  try {
    await writeJson(conf.EXPERIMENTAL_FEATURES_FILE, newFeatures);
  } catch {
    throw new Error(`Cannot write experimental features configuration to ${conf.EXPERIMENTAL_FEATURES_FILE}`);
  }
}

export async function isFeatureEnabled(feature) {
  const features = await getFeatures();
  return features[feature] === true;
}

const defaultConf = {
  API_HOST: 'https://api.clever-cloud.com',
  AUTH_BRIDGE_HOST: 'https://api-bridge.clever-cloud.com',
  SSH_GATEWAY: 'ssh@sshgateway-clevercloud-customers.services.clever-cloud.com',

  // the disclosure of these tokens is not considered as a vulnerability. Do not report this to our security service.
  OAUTH_CONSUMER_KEY: 'T5nFjKeHH4AIlEveuGhB5S3xg8T19e',
  OAUTH_CONSUMER_SECRET: 'MgVMqTr6fWlf2M0tkC2MXOnhfqBWDT',

  APP_CONFIGURATION_FILE: path.resolve('.', '.clever.json'),
  CONFIGURATION_FILE: getConfigPath(CONFIG_FILES.MAIN),
  EXPERIMENTAL_FEATURES_FILE: getConfigPath(CONFIG_FILES.EXPERIMENTAL_FEATURES_FILE),

  API_DOC_URL: 'https://www.clever.cloud/developers/api',
  DOC_URL: 'https://www.clever.cloud/developers/doc',
  CONSOLE_URL: 'https://console.clever-cloud.com',
  CONSOLE_TOKEN_URL: 'https://console.clever-cloud.com/cli-oauth',
  GOTO_URL: 'https://console.clever-cloud.com/goto',
};

export const conf = Object.fromEntries(
  Object.entries(defaultConf).map(([name, value]) => {
    if (process.env[name] != null) {
      return [name, process.env[name]];
    }
    return [name, value];
  }),
);
