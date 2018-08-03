'use strict';

const Bacon = require('baconjs');

const AppConfig = require('../models/app_configuration.js');
const Application = require('../models/application.js');
const handleCommandStream = require('../command-stream-handler');
const Logger = require('../logger.js');

function validateOptions (options) {

  let { flavor, 'min-flavor': minFlavor, 'max-flavor': maxFlavor } = options;
  let { instances, 'min-instances': minInstances, 'max-instances': maxInstances } = options;

  if ([flavor, minFlavor, maxFlavor, instances, minInstances, maxInstances].every((v) => v == null)) {
    throw new Error('You should provide at least 1 option');
  }

  if (flavor != null) {
    if (minFlavor != null || maxFlavor != null) {
      throw new Error(`You can't use --flavor and --min-flavor or --max-flavor at the same time`);
    }
    minFlavor = flavor;
    maxFlavor = flavor;
  }

  if (instances != null) {
    if (minInstances != null || maxInstances != null) {
      throw new Error(`You can't use --instances and --min-instances or --max-instances at the same time`);
    }
    minInstances = instances;
    maxInstances = instances;
  }

  if (minInstances != null && maxInstances != null && minInstances > maxInstances) {
    throw new Error(`min-instances can't be greater than max-instances`);
  }

  if (minFlavor != null && maxFlavor != null) {
    const minFlavorIndex = Application.listAvailableFlavors().indexOf(minFlavor);
    const maxFlavorIndex = Application.listAvailableFlavors().indexOf(maxFlavor);
    if (minFlavorIndex > maxFlavorIndex) {
      throw new Error(`min-flavor can't be a greater flavor than max-flavor`);
    }
  }

  return { minFlavor, maxFlavor, minInstances, maxInstances };
}

// https://github.com/baconjs/bacon.js/wiki/FAQ#why-isnt-my-subscriber-called
function asStream (fn) {
  return Bacon.later(0).flatMapLatest(Bacon.try(fn));
}

function scale (api, params) {
  const { alias } = params.options;

  const s_scaledApp = asStream(() => validateOptions(params.options))
    .flatMapLatest(({ minFlavor, maxFlavor, minInstances, maxInstances }) => {
      return AppConfig.getAppData(alias).flatMapLatest((appData) => {
        const scalabilityParameters = { minFlavor, maxFlavor, minInstances, maxInstances };
        return Application.setScalability(api, appData.app_id, appData.org_id, scalabilityParameters);
      });
    })
    .map(() => Logger.println('App rescaled successfully'));

  handleCommandStream(s_scaledApp);
};

module.exports = scale;
