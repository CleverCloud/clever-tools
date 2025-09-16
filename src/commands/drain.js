import { createDrain, deleteDrain, disableDrain, enableDrain, getDrains } from '../clever-client/drains.js';
import { styleText } from '../lib/style-text.js';
import { Logger } from '../logger.js';
import * as Application from '../models/application.js';
import { resolveOwnerId } from '../models/ids-resolver.js';
import { sendToApi } from '../models/send-to-api.js';

const DRAIN_TYPES = [
  'DatadogRecipient',
  'ElasticsearchRecipient',
  'NewRelicRecipient',
  'OVHTCPRecipient',
  'RawRecipient',
  'SyslogTCPRecipient',
  'SyslogUDPRecipient',
];

// TODO: This could be useful in other commands
async function getAppOrAddonId({ alias, appIdOrName, addonId }) {
  return addonId != null ? addonId : await Application.resolveId(appIdOrName, alias).then(({ appId }) => appId);
}

export async function list(params) {
  const { alias, app: appIdOrName, addon: addonId, format } = params.options;

  const applicationId = await getAppOrAddonId({ alias, appIdOrName, addonId });
  const ownerId = await resolveOwnerId(applicationId);

  const drains = await getDrains({ ownerId, applicationId }).then(sendToApi);

  switch (format) {
    case 'json': {
      const formattedDrains = drains.map((drain) => ({
        id: drain.id,
        target: drain.recipient,
        state: drain.status,
      }));

      Logger.printJson(formattedDrains);
      break;
    }
    case 'human':
    default: {
      if (drains.length === 0) {
        Logger.println(`There are no drains for ${applicationId}`);
      }

      drains.forEach((drain) => {
        const { id, index, rfc5424StructuredDataParameters, recipient, status } = drain;
        const { url, type } = recipient;

        let drainView = `${id} -> ${status.status} for ${url} as ${type}`;
        if (index != null) {
          drainView += `, custom index: '${index}-YYYY-MM-DD'`;
        }
        if (rfc5424StructuredDataParameters != null) {
          drainView += `, sd-params: '${rfc5424StructuredDataParameters}'`;
        }

        Logger.println(drainView);
      });
    }
  }
}

export async function create(params) {
  const { alias, app: appIdOrName, addon: addonId } = params.options;
  const {
    username,
    password,
    'api-key': apiKey,
    'index-prefix': indexPrefix,
    'sd-params': rfc5424StructuredDataParameters,
  } = params.options;
  const [type, url] = params.args;

  if (!DRAIN_TYPES.includes(type)) {
    throw new Error(`Invalid drain type. Supported types are: ${DRAIN_TYPES.join(', ')}`);
  }

  const applicationId = await getAppOrAddonId({ alias, appIdOrName, addonId });
  const ownerId = await resolveOwnerId(applicationId);

  if (type === 'ElasticsearchRecipient') {
    if (!indexPrefix) {
      throw new Error('ElasticsearchRecipient drains require an index prefix (--index-prefix) to be set');
    }

    if (!url.endsWith('/_bulk')) {
      throw new Error("ElasticsearchRecipient drain URL must end with '/_bulk'");
    }
  }

  if (type === 'OVHTCPRecipient' && !rfc5424StructuredDataParameters) {
    throw new Error('OVHTCPRecipient drains require RFC5424 structured data parameters (--sd-params) to be set');
  }

  const recipientExtras = {
    ElasticsearchRecipient: {
      indexPrefix,
      ...(username && { username }),
      ...(password && { password }),
    },
    NewRelicRecipient: { apiKey },
    OVHTCPRecipient: { rfc5424StructuredDataParameters },
    RawRecipient: {
      ...(username && { username }),
      ...(password && { password }),
    },
  };

  const body = {
    kind: 'LOG',
    recipient: {
      type,
      url,
      ...(recipientExtras[type] || {}),
    },
  };

  const drain = await createDrain({ applicationId, ownerId, body }).then(sendToApi);
  Logger.printSuccess(`Drain ${styleText(['bold', 'green'], drain.id)} has been successfully created and enabled!`);
}

export async function remove(params) {
  const [drainId] = params.args;
  const { alias, app: appIdOrName, addon: addonId } = params.options;

  const applicationId = await getAppOrAddonId({ alias, appIdOrName, addonId });
  const ownerId = await resolveOwnerId(applicationId);

  await deleteDrain({ applicationId, ownerId, drainId }).then(sendToApi);
  Logger.printSuccess(`Drain ${styleText(['bold', 'green'], drainId)} has been successfully removed!`);
}

export async function enable(params) {
  const [drainId] = params.args;
  const { alias, app: appIdOrName, addon: addonId } = params.options;

  const applicationId = await getAppOrAddonId({ alias, appIdOrName, addonId });
  const ownerId = await resolveOwnerId(applicationId);

  await enableDrain({ ownerId, applicationId, drainId }).then(sendToApi);

  Logger.printSuccess(`Drain ${styleText(['bold', 'green'], drainId)} has been successfully enabled!`);
}

export async function disable(params) {
  const [drainId] = params.args;
  const { alias, app: appIdOrName, addon: addonId } = params.options;

  const applicationId = await getAppOrAddonId({ alias, appIdOrName, addonId });
  const ownerId = await resolveOwnerId(applicationId);

  await disableDrain({ ownerId, applicationId, drainId }).then(sendToApi);

  Logger.printSuccess(`Drain ${styleText(['bold', 'green'], drainId)} has been successfully disabled!`);
}
