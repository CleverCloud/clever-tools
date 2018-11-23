'use strict';

const _ = require('lodash');

const AppConfig = require('../models/app_configuration.js');
const Drain = require('../models/drain.js');
const handleCommandStream = require('../command-stream-handler');
const Logger = require('../logger.js');

function list (api, params) {
  const { alias } = params.options;

  const s_drain = AppConfig.getAppData(alias)
    .flatMapLatest((appData) => Drain.list(api, appData.app_id))
    .map((drains) => {
      _.forEach(drains, (drain) => {
        const { id, state, target: { url, drainType } } = drain;
        Logger.println(`${id} -> ${state} for ${url} as ${drainType}`);
      });
    });

  handleCommandStream(s_drain);
}

function create (api, params) {
  const [drainTargetType, drainTargetURL] = params.args;
  const { alias, username, password, 'api-key': apiKey } = params.options;
  const drainTargetCredentials = { username, password };
  const drainTargetConfig = { apiKey };

  const s_drain = AppConfig.getAppData(alias)
    .flatMapLatest((appData) => {
      return Drain.create(api, appData.app_id, drainTargetURL, drainTargetType, drainTargetCredentials, drainTargetConfig);
    })
    .map(() => Logger.println('Your drain has been successfully saved'));

  handleCommandStream(s_drain);
}

function rm (api, params) {
  const [drainId] = params.args;
  const { alias } = params.options;

  const s_drain = AppConfig.getAppData(alias)
    .flatMapLatest((appData) => Drain.remove(api, appData.app_id, drainId))
    .map(() => Logger.println('Your drain has been successfully removed'));

  handleCommandStream(s_drain);
}

function enable (api, params) {
  const [drainId] = params.args;
  const { alias } = params.options;

  const s_drain = AppConfig.getAppData(alias)
    .flatMapLatest((appData) => Drain.enable(api, appData.app_id, drainId))
    .map(() => Logger.println('Your drain has been enabled'));

  handleCommandStream(s_drain);
}

function disable (api, params) {
  const [drainId] = params.args;
  const { alias } = params.options;

  const s_drain = AppConfig.getAppData(alias)
    .flatMapLatest((appData) => Drain.disable(api, appData.app_id, drainId))
    .map(() => Logger.println('Your drain has been disabled'));

  handleCommandStream(s_drain);
}

module.exports = {
  list,
  create,
  rm,
  enable,
  disable,
};
