import { EXPERIMENTAL_FEATURES } from '../experimental-features.js';
import { formatTable } from '../format-table.js';
import { Logger } from '../logger.js';
import { getFeatures, setFeature } from '../models/configuration.js';

export async function list(params) {
  const { format } = params.options;

  const featuresConf = await getFeatures();
  // Add status from configuration file and remove instructions
  const features = Object.entries(EXPERIMENTAL_FEATURES).map(([id, feature]) => {
    const enabled = featuresConf[id] === true;
    return {
      id,
      status: feature.status,
      description: feature.description,
      enabled,
    };
  });

  // For each feature, print the object with the id, status, description and enabled
  switch (format) {
    case 'json': {
      Logger.printJson(features);
      break;
    }
    case 'human':
    default: {
      const headers = ['ID', 'STATUS', 'DESCRIPTION', 'ENABLED'];

      Logger.println(
        formatTable([
          headers,
          ...features.map((feature) => [feature.id, feature.status, feature.description, feature.enabled]),
        ]),
      );
    }
  }
}

export async function info(params) {
  const { feature } = params.namedArgs;
  const availableFeatures = Object.keys(EXPERIMENTAL_FEATURES);

  if (!availableFeatures.includes(feature)) {
    throw new Error(`Unavailable feature: ${feature}`);
  }

  Logger.println(EXPERIMENTAL_FEATURES[feature].instructions);
}

export async function enable(params) {
  const { features } = params.namedArgs;
  const availableFeatures = Object.keys(EXPERIMENTAL_FEATURES);

  const unknownFeatures = features.filter((feature) => !availableFeatures.includes(feature));
  if (unknownFeatures.length > 0) {
    throw new Error(`Unavailable feature(s): ${unknownFeatures.join(', ')}`);
  }

  for (const featureName of features) {
    await setFeature(featureName, true);
    Logger.println(`Experimental feature '${featureName}' enabled`);
  }

  if (features.length === 1) {
    Logger.println(EXPERIMENTAL_FEATURES[features[0]].instructions);
  } else {
    Logger.println();
    Logger.println("To learn more about these experimental features, use 'clever features info FEATURE_NAME'");
  }
}

export async function disable(params) {
  const { features } = params.namedArgs;
  const availableFeatures = Object.keys(EXPERIMENTAL_FEATURES);

  const unknownFeatures = features.filter((feature) => !availableFeatures.includes(feature));
  if (unknownFeatures.length > 0) {
    throw new Error(`Unavailable feature(s): ${unknownFeatures.join(', ')}`);
  }

  for (const featureName of features) {
    await setFeature(featureName, false);
    Logger.println(`Experimental feature '${featureName}' disabled`);
  }
}
