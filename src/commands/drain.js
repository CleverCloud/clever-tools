'use strict';

const AppConfig = require('../models/app_configuration.js');
const { createDrainBody } = require('../models/drain.js');
const Logger = require('../logger.js');

const { getDrains, createDrain, deleteDrain, updateDrainState } = require('@clevercloud/client/cjs/api/log.js');
const { sendToApi } = require('../models/send-to-api.js');

async function list (params) {
  const { alias } = params.options;

  const { app_id: appId } = await AppConfig.getAppData(alias).toPromise();
  const drains = await getDrains({ appId }).then(sendToApi);

  drains.forEach((drain) => {
    const { id, state, target: { url, drainType } } = drain;
    Logger.println(`${id} -> ${state} for ${url} as ${drainType}`);
  });
}

async function create (params) {
  const [drainTargetType, drainTargetURL] = params.args;
  const { alias, username, password, 'api-key': apiKey } = params.options;
  const drainTargetCredentials = { username, password };
  const drainTargetConfig = { apiKey };

  const { app_id: appId } = await AppConfig.getAppData(alias).toPromise();
  const body = createDrainBody(appId, drainTargetURL, drainTargetType, drainTargetCredentials, drainTargetConfig);
  await createDrain({ appId }, body).then(sendToApi);

  Logger.println('Your drain has been successfully saved');
}

async function rm (params) {
  const [drainId] = params.args;
  const { alias } = params.options;

  const { app_id: appId } = await AppConfig.getAppData(alias).toPromise();
  await deleteDrain({ appId, drainId }).then(sendToApi);

  Logger.println('Your drain has been successfully removed');
}

async function enable (params) {
  const [drainId] = params.args;
  const { alias } = params.options;

  const { app_id: appId } = await AppConfig.getAppData(alias).toPromise();
  await updateDrainState({ appId, drainId }, { state: 'ENABLED' }).then(sendToApi);

  Logger.println('Your drain has been enabled');
}

async function disable (params) {
  const [drainId] = params.args;
  const { alias } = params.options;

  const { app_id: appId } = await AppConfig.getAppData(alias).toPromise();
  await updateDrainState({ appId, drainId }, { state: 'DISABLED' }).then(sendToApi);

  Logger.println('Your drain has been disabled');
}

module.exports = {
  list,
  create,
  rm,
  enable,
  disable,
};
