'use strict';

const Application = require('../models/application.js');
const { createDrainBody } = require('../models/drain.js');
const Logger = require('../logger.js');

const { getDrains, createDrain, deleteDrain, updateDrainState } = require('@clevercloud/client/cjs/api/v2/log.js');
const { sendToApi } = require('../models/send-to-api.js');

// TODO: This could be useful in other commands
async function getAppOrAddonId ({ alias, appIdOrName, addonId }) {
  return (addonId != null)
    ? addonId
    : await Application.resolveId(appIdOrName, alias).then(({ appId }) => appId);
}

async function list (params) {
  const { alias, app: appIdOrName, addon: addonId, format } = params.options;

  const appIdOrAddonId = await getAppOrAddonId({ alias, appIdOrName, addonId });
  const drains = await getDrains({ appId: appIdOrAddonId }).then(sendToApi);

  switch (format) {
    case 'json': {
      const formattedDrains = drains.map((drain) => ({
        id: drain.id,
        target: drain.target,
        state: drain.state,
      }));

      Logger.printJson(formattedDrains);
      break;
    }
    case 'human':
    default: {
      if (drains.length === 0) {
        Logger.println(`There are no drains for ${appIdOrAddonId}`);
      }

      drains.forEach((drain) => {
        const { id, state, target } = drain;
        const { url, drainType, indexPrefix, structuredDataParameters } = target;

        let drainView = `${id} -> ${state} for ${url} as ${drainType}`;
        if (indexPrefix != null) {
          drainView += `, index: '${indexPrefix}-<YYYY-MM-DD>'`;
        }
        if (structuredDataParameters != null) {
          drainView += `, sd-params: '${structuredDataParameters}'`;
        }
        Logger.println(drainView);
      });
    }
  }
}

async function create (params) {
  const [drainTargetType, drainTargetURL] = params.args;
  const { alias, app: appIdOrName, addon: addonId, username, password, 'api-key': apiKey, 'index-prefix': indexPrefix, 'sd-params': structuredDataParameters } = params.options;
  const drainTargetCredentials = { username, password };
  const drainTargetConfig = { apiKey, indexPrefix, structuredDataParameters };

  const appIdOrAddonId = await getAppOrAddonId({ alias, appIdOrName, addonId });
  const body = createDrainBody(appIdOrAddonId, drainTargetURL, drainTargetType, drainTargetCredentials, drainTargetConfig);
  await createDrain({ appId: appIdOrAddonId }, body).then(sendToApi);

  Logger.println('Your drain has been successfully saved');
}

async function rm (params) {
  const [drainId] = params.args;
  const { alias, app: appIdOrName, addon: addonId } = params.options;

  const appIdOrAddonId = await getAppOrAddonId({ alias, appIdOrName, addonId });
  await deleteDrain({ appId: appIdOrAddonId, drainId }).then(sendToApi);

  Logger.println('Your drain has been successfully removed');
}

async function enable (params) {
  const [drainId] = params.args;
  const { alias, app: appIdOrName, addon: addonId } = params.options;

  const appIdOrAddonId = await getAppOrAddonId({ alias, appIdOrName, addonId });
  await updateDrainState({ appId: appIdOrAddonId, drainId }, { state: 'ENABLED' }).then(sendToApi);

  Logger.println('Your drain has been enabled');
}

async function disable (params) {
  const [drainId] = params.args;
  const { alias, app: appIdOrName, addon: addonId } = params.options;

  const appIdOrAddonId = await getAppOrAddonId({ alias, appIdOrName, addonId });
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
