'use strict';

const Bacon = require('baconjs');

const AppConfig = require('../models/app_configuration.js');
const handleCommandStream = require('../command-stream-handler');
const Logger = require('../logger.js');
const PublishedConfig = require('../models/published-config.js');
const variables = require('../models/variables.js');
const { toNameEqualsValueString, validateName } = require('@clevercloud/client/cjs/utils/env-vars.js');

function list (api, params) {
  const { alias } = params.options;

  const s_env = AppConfig.getAppData(alias)
    .flatMap(({ app_id, org_id }) => PublishedConfig.list(api, app_id, org_id))
    .flatMapLatest((publishedConfigs) => {
      const pairs = Object.entries(publishedConfigs)
        .map(([name, value]) => ({ name, value }));
      Logger.println('# Published configs');
      Logger.println(toNameEqualsValueString(pairs));
    });

  handleCommandStream(s_env);
};

function set (api, params) {
  const [varName, varValue] = params.args;
  const { alias } = params.options;

  const s_env = AppConfig.getAppData(alias)
    .flatMapLatest((params) => {
      const nameIsValid = validateName(varName);
      if (!nameIsValid) {
        return new Bacon.Error(`Published config name ${varName} is invalid`);
      }
      return params;
    })
    .flatMapLatest(({ app_id, org_id }) => PublishedConfig.set(api, varName, varValue, app_id, org_id))
    .flatMapLatest(() => Logger.println('Your published config item has been successfully saved'));

  handleCommandStream(s_env);
};

function rm (api, params) {
  const [varName] = params.args;
  const { alias } = params.options;

  const s_env = AppConfig.getAppData(alias)
    .flatMapLatest(({ app_id, org_id }) => PublishedConfig.remove(api, varName, app_id, org_id))
    .flatMapLatest(() => Logger.println('Your published config item has been successfully removed'));

  handleCommandStream(s_env);
};

function importEnv (api, params) {
  const { alias } = params.options;

  const s_appData = AppConfig.getAppData(alias);
  const s_vars = Bacon.fromPromise(variables.readVariablesFromStdin());

  const s_result = Bacon.combineAsArray(s_appData, s_vars)
    .flatMapLatest(([appData, vars]) => {
      return PublishedConfig.bulkSet(api, vars, appData.app_id, appData.org_id);
    })
    .flatMapLatest(() => Logger.println('Environment variables have been set'));

  handleCommandStream(s_result);
};

module.exports = { list, set, rm, importEnv };
