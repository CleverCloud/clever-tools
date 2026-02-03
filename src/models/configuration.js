import { config } from '../config/config.js';
import { getConfigPath } from '../config/paths.js';
import { readJson, writeJson } from '../lib/fs.js';
import { Logger } from '../logger.js';

const CONFIG_FILES = {
  IDS_CACHE: 'ids-cache.json',
};

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
  Logger.debug('Get features configuration from ' + config.EXPERIMENTAL_FEATURES_FILE);
  try {
    return readJson(config.EXPERIMENTAL_FEATURES_FILE);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw new Error(`Cannot get experimental features configuration from ${config.EXPERIMENTAL_FEATURES_FILE}`);
    }
    return {};
  }
}

export async function setFeature(feature, value) {
  const currentFeatures = await getFeatures();
  const newFeatures = { ...currentFeatures, ...{ [feature]: value } };
  try {
    await writeJson(config.EXPERIMENTAL_FEATURES_FILE, newFeatures);
  } catch {
    throw new Error(`Cannot write experimental features configuration to ${config.EXPERIMENTAL_FEATURES_FILE}`);
  }
}

export async function isFeatureEnabled(feature) {
  const features = await getFeatures();
  return features[feature] === true;
}
