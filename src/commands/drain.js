'use strict';

const AppConfig = require('../models/app_configuration.js');
const { createDrainBody } = require('../models/drain.js');
const Logger = require('../logger.js');

const { getDrains, createDrain, deleteDrain, updateDrainState } = require('@clevercloud/client/cjs/api/log.js');
const { sendToApi } = require('../models/send-to-api.js');

// TODO: This could be useful in other commands
async function getAppOrAddonId ({ alias, addonId }) {
  return (addonId != null)
    ? addonId
    : AppConfig.getAppDetails({ alias }).then(({ appId }) => appId);
}

async function list (params) {
  const { alias, addon: addonId } = params.options;

  const appIdOrAddonId = await getAppOrAddonId({ alias, addonId });
  const drains = await getDrains({ appId: appIdOrAddonId }).then(sendToApi);

  if (drains.length === 0) {
    Logger.println(`There are no drains for ${appIdOrAddonId}`);
  }

  drains.forEach((drain) => {
    const { id, state, target: { url, drainType } } = drain;
    Logger.println(`${id} -> ${state} for ${url} as ${drainType}`);
  });
}

async function create (params) {
  const [drainTargetType, drainTargetURL] = params.args;
  const { alias, addon: addonId, username, password, 'api-key': apiKey } = params.options;
  const drainTargetCredentials = { username, password };
  const drainTargetConfig = { apiKey };

  const appIdOrAddonId = await getAppOrAddonId({ alias, addonId });
  const body = createDrainBody(appIdOrAddonId, drainTargetURL, drainTargetType, drainTargetCredentials, drainTargetConfig);
  await createDrain({ appId: appIdOrAddonId }, body).then(sendToApi);

  Logger.println('Your drain has been successfully saved');
}

async function rm (params) {
  const [drainId] = params.args;
  const { alias, addon: addonId } = params.options;

  const appIdOrAddonId = await getAppOrAddonId({ alias, addonId });
  await deleteDrain({ appId: appIdOrAddonId, drainId }).then(sendToApi);

  Logger.println('Your drain has been successfully removed');
}

async function enable (params) {
  const [drainId] = params.args;
  const { alias, addon: addonId } = params.options;

  const appIdOrAddonId = await getAppOrAddonId({ alias, addonId });
  await updateDrainState({ appId: appIdOrAddonId, drainId }, { state: 'ENABLED' }).then(sendToApi);

  Logger.println('Your drain has been enabled');
}

async function disable (params) {
  const [drainId] = params.args;
  const { alias, addon: addonId } = params.options;

  const appIdOrAddonId = await getAppOrAddonId({ alias, addonId });
  await updateDrainState({ appId: appIdOrAddonId, drainId }, { state: 'DISABLED' }).then(sendToApi);

  Logger.println('Your drain has been disabled');
}

module.exports = {
  list,
  create,
  rm,
  enable,
  disable,
};
