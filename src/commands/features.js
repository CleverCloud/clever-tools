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
  const features = EXPERIMENTAL_FEATURES.map((feature) => {
    const enabled = features_conf[feature.id] === true;
    return { ...feature, enabled };
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

export async function enable (params) {
  const { features } = params.namedArgs;
  const availableFeatures = EXPERIMENTAL_FEATURES.map((feature) => feature.id);

  for (const featureName of features) {
    if (!availableFeatures.includes(featureName)) {
      Logger.printErrorLine(`- Feature '${featureName}' is not available`);
      continue;
    }
    await setFeature(featureName, true);
    Logger.println(`- Experimental feature '${featureName}' enabled`);
  }
}

export async function disable (params) {
  const { features } = params.namedArgs;
  const availableFeatures = EXPERIMENTAL_FEATURES.map((feature) => feature.id);

  for (const featureName of features) {
    if (!availableFeatures.includes(featureName)) {
      Logger.printErrorLine(`- Feature '${featureName}' is not available`);
      continue;
    }
    await setFeature(featureName, false);
    Logger.println(`- Experimental feature '${featureName}' disabled`);
  }
}
