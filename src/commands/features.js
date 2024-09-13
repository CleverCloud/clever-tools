'use strict';

const { getFeatures, setFeature } = require('../models/configuration.js');
const { AVAILABLE_FEATURES } = require('../models/features.js');
const Logger = require('../logger.js');

async function list (params) {
  const { format } = params.options;
  const features = await getFeatures();

  switch (format) {
    case 'json': {
      Logger.printJson(features);
      break;
    }
    case 'human':
    default: {
      for (const feature in features) {
        console.log(`- ${feature}: ${features[feature]}`);
      }
    }
  }
}

async function enable (params) {
  const { 'feature-name': featureName } = params.namedArgs;

  if (!AVAILABLE_FEATURES.includes(featureName)) {
    throw new Error(`Feature '${featureName}' is not available`);
  }

  await setFeature(featureName, true);
  Logger.println(`Experimental feature '${featureName}' enabled`);
}

async function disable (params) {
  const { 'feature-name': featureName } = params.namedArgs;

  if (!AVAILABLE_FEATURES.includes(featureName)) {
    throw new Error(`Feature '${featureName}' is not available`);
  }

  await setFeature(featureName, false);
  Logger.println(`Experimental feature '${featureName}' disabled`);
}

module.exports = { disable, enable, list };
