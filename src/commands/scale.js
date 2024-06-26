'use strict';

const Application = require('../models/application.js');
const Logger = require('../logger.js');

function validateOptions (options) {

  let { flavor, 'min-flavor': minFlavor, 'max-flavor': maxFlavor } = options;
  let { instances, 'min-instances': minInstances, 'max-instances': maxInstances, 'build-flavor': buildFlavor } = options;

  if ([flavor, minFlavor, maxFlavor, instances, minInstances, maxInstances, buildFlavor].every((v) => v == null)) {
    throw new Error('You should provide at least 1 option');
  }

  if (flavor != null) {
    if (minFlavor != null || maxFlavor != null) {
      throw new Error('You can\'t use --flavor and --min-flavor or --max-flavor at the same time');
    }
    minFlavor = flavor;
    maxFlavor = flavor;
  }

  if (instances != null) {
    if (minInstances != null || maxInstances != null) {
      throw new Error('You can\'t use --instances and --min-instances or --max-instances at the same time');
    }
    minInstances = instances;
    maxInstances = instances;
  }

  if (minInstances != null && maxInstances != null && minInstances > maxInstances) {
    throw new Error('min-instances can\'t be greater than max-instances');
  }

  if (minFlavor != null && maxFlavor != null) {
    const minFlavorIndex = Application.listAvailableFlavors().indexOf(minFlavor);
    const maxFlavorIndex = Application.listAvailableFlavors().indexOf(maxFlavor);
    if (minFlavorIndex > maxFlavorIndex) {
      throw new Error('min-flavor can\'t be a greater flavor than max-flavor');
    }
  }

  return { minFlavor, maxFlavor, minInstances, maxInstances, buildFlavor };
}

async function scale (params) {
  const { alias, app: appIdOrName } = params.options;
  const { minFlavor, maxFlavor, minInstances, maxInstances, buildFlavor } = validateOptions(params.options);
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  await Application.setScalability(appId, ownerId, {
    minFlavor,
    maxFlavor,
    minInstances,
    maxInstances,
  }, buildFlavor);

  Logger.println('App rescaled successfully');
};

module.exports = { scale };
