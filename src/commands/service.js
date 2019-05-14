'use strict';

const Bacon = require('baconjs');

const Addon = require('../models/addon.js');
const AppConfig = require('../models/app_configuration.js');
const Application = require('../models/application.js');
const handleCommandStream = require('../command-stream-handler');
const Logger = require('../logger.js');

function validateOptions ({ onlyApps, onlyAddons }) {
  if (onlyApps && onlyAddons) {
    throw new Error('--only-apps and --only-addons are mutually exclusive');
  }
}

// https://github.com/baconjs/bacon.js/wiki/FAQ#why-isnt-my-subscriber-called
function asStream (fn) {
  return Bacon.later(0).flatMapLatest(Bacon.try(fn));
}

function list (api, params) {
  const { alias, 'show-all': showAll, 'only-apps': onlyApps, 'only-addons': onlyAddons } = params.options;

  const s_result = asStream(() => validateOptions({ onlyApps, onlyAddons }))
    .flatMapLatest(() => AppConfig.getAppData(alias))
    .flatMapLatest((appData) => {

      const s_apps = onlyAddons ? null : Application.listDependencies(api, appData.app_id, appData.org_id, showAll)
        .flatMapLatest((apps) => {
          Logger.println('Applications:');
          apps.forEach(({ isLinked, name }) => Logger.println(`${isLinked ? '*' : ' '} ${name}`));
        });

      const s_addons = onlyApps ? null : Addon.list(api, appData.org_id, appData.app_id, showAll)
        .flatMapLatest((addons) => {
          Logger.println('Addons:');
          addons.forEach(({ isLinked, name, realId }) => Logger.println(`${isLinked ? '*' : ' '} ${name} (${realId})`));
        });

      return Bacon.combineAsArray(s_apps, s_addons);
    });

  handleCommandStream(s_result);
}

function linkApp (api, params) {
  const { alias } = params.options;
  const [appIdOrName] = params.args;

  const s_result = AppConfig.getAppData(alias)
    .flatMapLatest((appData) => {
      return Application.link(api, appData.app_id, appData.org_id, appIdOrName);
    })
    .map(() => Logger.println(`App ${appIdOrName.app_id || appIdOrName.app_name} successfully linked`));

  handleCommandStream(s_result);
}

function unlinkApp (api, params) {
  const { alias } = params.options;
  const [appIdOrName] = params.args;

  const s_result = AppConfig.getAppData(alias)
    .flatMapLatest((appData) => {
      return Application.unlink(api, appData.app_id, appData.org_id, appIdOrName);
    })
    .map(() => Logger.println(`App ${appIdOrName.app_id || appIdOrName.app_name} successfully unlinked`));

  handleCommandStream(s_result);
}

function linkAddon (api, params) {
  const { alias } = params.options;
  const [addonIdOrName] = params.args;

  const s_result = AppConfig.getAppData(alias)
    .flatMapLatest((appData) => {
      return Addon.link(api, appData.app_id, appData.org_id, addonIdOrName);
    })
    .map(() => Logger.println(`Addon ${addonIdOrName.addon_id || addonIdOrName.addon_name} successfully linked`));

  handleCommandStream(s_result);
}

function unlinkAddon (api, params) {
  const { alias } = params.options;
  const [addonIdOrName] = params.args;

  const s_result = AppConfig.getAppData(alias)
    .flatMapLatest((appData) => {
      return Addon.unlink(api, appData.app_id, appData.org_id, addonIdOrName);
    })
    .map(() => Logger.println(`Addon ${addonIdOrName.addon_id || addonIdOrName.addon_name} successfully unlinked`));

  handleCommandStream(s_result);
}

module.exports = {
  list,
  linkApp,
  unlinkApp,
  linkAddon,
  unlinkAddon,
};
