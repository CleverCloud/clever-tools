import { getFeatures, setFeature } from '../models/configuration.js';
import { EXPERIMENTAL_FEATURES } from '../experimental-features.js';
import { formatTable } from '../format-table.js';
import { Logger } from '../logger.js';

function getPropertyMaxWidth (array, propertyName) {
  return Math.max(...array.map((o) => o[propertyName].length));
}

export async function list (params) {
  const { format } = params.options;

  const features_conf = await getFeatures();
  // Add status from configuration file and remove instructions
  const features = Object.entries(EXPERIMENTAL_FEATURES).map(([id, feature]) => {
    const enabled = features_conf[id] === true;
    return { ...feature, id, enabled, instructions: undefined };
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
      const columnWidths = [
        getPropertyMaxWidth(features, 'id'),
        getPropertyMaxWidth(features, 'status'),
        getPropertyMaxWidth(features, 'description'),
        getPropertyMaxWidth(features, 'enabled'),
      ];

      // We calculate the maximum width of each column to format the table
      const formatTableWithColumnWidth = formatTable(columnWidths);

      Logger.println(formatTableWithColumnWidth([
        headers,
        ...features.map((feature) => [
          feature.id,
          feature.status,
          feature.description,
          feature.enabled,
        ]),
      ]));
    }
  }
}

export async function help (params) {
  const { feature } = params.namedArgs;
  const availableFeatures = Object.keys(EXPERIMENTAL_FEATURES);

  if (!availableFeatures.includes(feature)) {
    Logger.printErrorLine(`Feature '${feature}' is not available`);
  }
  else {
    Logger.println(EXPERIMENTAL_FEATURES[feature].instructions);
  }
}

export async function enable (params) {
  const { features } = params.namedArgs;
  const availableFeatures = Object.keys(EXPERIMENTAL_FEATURES);
  const canEnableFeatures = features.filter((feature) => availableFeatures.includes(feature));

  for (const featureName of features) {
    if (!availableFeatures.includes(featureName)) {
      Logger.printErrorLine(`Feature '${featureName}' is not available`);
      continue;
    }
    await setFeature(featureName, true);
    Logger.println(`Experimental feature '${featureName}' enabled`);

    if (canEnableFeatures.length === 1) Logger.println(EXPERIMENTAL_FEATURES[featureName].instructions);
  }

  if (canEnableFeatures.length > 1) {
    Logger.println();
    Logger.println("To learn more about these experimental features, use 'clever features help FEATURE_NAME'");
  }
}

export async function disable (params) {
  const { features } = params.namedArgs;
  const availableFeatures = Object.keys(EXPERIMENTAL_FEATURES);

  for (const featureName of features) {
    if (!availableFeatures.includes(featureName)) {
      Logger.printErrorLine(`Feature '${featureName}' is not available`);
      continue;
    }
    await setFeature(featureName, false);
    Logger.println(`Experimental feature '${featureName}' disabled`);
  }
}
