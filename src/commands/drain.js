import { createDrain, deleteDrain, disableDrain, enableDrain, getDrain, getDrains } from '../clever-client/drains.js';
import { styleText } from '../lib/style-text.js';
import { Logger } from '../logger.js';
import * as Application from '../models/application.js';
import { DRAIN_TYPE_CLI_CODES, DRAIN_TYPES, formatDrain } from '../models/drain.js';
import { sendToApi } from '../models/send-to-api.js';

export async function list(options) {
  const { alias, app: appIdOrName, format } = options;

  const { ownerId, appId: applicationId } = await Application.resolveId(appIdOrName, alias);

  const drains = await getDrains({ ownerId, applicationId }).then(sendToApi);

  switch (format) {
    case 'json': {
      Logger.printJson(drains);
      break;
    }
    case 'human':
    default: {
      if (drains.length === 0) {
        Logger.println(`There are no drains for ${applicationId}`);
        return;
      }

      if (drains.length === 1) {
        const formattedDrain = formatDrain(drains[0]);
        console.table(formattedDrain);
        return;
      }

      const formattedDrains = drains.map((drain) => {
        return {
          ID: drain.id,
          Status: drain.status.status,
          'Execution status': drain.execution.status,
          URL: drain.recipient.url,
        };
      });

      console.table(formattedDrains);
    }
  }
}

export async function create(options, drainTypeCliCode, url) {
  const { alias, app: appIdOrName } = options;
  const {
    username,
    password,
    'api-key': apiKey,
    'index-prefix': indexPrefix,
    'sd-params': rfc5424StructuredDataParameters,
  } = options;

  const drainType = Object.values(DRAIN_TYPES).find((drainType) => drainType.cliCode === drainTypeCliCode);
  if (!drainType) {
    throw new Error(`Invalid drain type. Supported types are: ${DRAIN_TYPE_CLI_CODES.join(', ')}`);
  }

  const { ownerId, appId: applicationId } = await Application.resolveId(appIdOrName, alias);

  const body = {
    kind: 'LOG',
    recipient: {
      type: drainType.apiCode,
      url,
    },
  };

  if (drainTypeCliCode === DRAIN_TYPES.ELASTICSEARCH.cliCode) {
    if (!indexPrefix) {
      throw new Error(`${DRAIN_TYPES.ELASTICSEARCH.cliCode} drains require an index prefix (--index-prefix) to be set`);
    }
    if (!url.endsWith('/_bulk')) {
      throw new Error(`${DRAIN_TYPES.ELASTICSEARCH.cliCode} drain URL must end with '/_bulk'`);
    }
    body.recipient.index = indexPrefix;
  }

  if (drainTypeCliCode === DRAIN_TYPES.ELASTICSEARCH.cliCode || drainTypeCliCode === DRAIN_TYPES.RAW_HTTP.cliCode) {
    if (username) {
      body.recipient.username = username;
    }
    if (password) {
      body.recipient.password = password;
    }
  }

  if (drainTypeCliCode === DRAIN_TYPES.NEWRELIC.cliCode) {
    if (!apiKey) {
      throw new Error(`${DRAIN_TYPES.NEWRELIC.cliCode} drains require an API key (--api-key) to be set`);
    }
    body.recipient.apiKey = apiKey;
  }

  if (
    drainTypeCliCode === DRAIN_TYPES.OVH_TCP.cliCode ||
    drainTypeCliCode === DRAIN_TYPES.SYSLOG_TCP.cliCode ||
    drainTypeCliCode === DRAIN_TYPES.SYSLOG_UDP.cliCode
  ) {
    if (rfc5424StructuredDataParameters) {
      body.recipient.rfc5424StructuredDataParameters = rfc5424StructuredDataParameters;
    }
  }

  const drain = await createDrain({ ownerId, applicationId, body }).then(sendToApi);
  Logger.printSuccess(`Drain ${styleText(['bold', 'green'], drain.id)} has been successfully created and enabled!`);
}

export async function get(options, drainId) {
  const { alias, app: appIdOrName, format } = options;

  const { ownerId, appId: applicationId } = await Application.resolveId(appIdOrName, alias);

  const drain = await getDrain({ ownerId, applicationId, drainId }).then(sendToApi);

  switch (format) {
    case 'json': {
      Logger.printJson(drain);
      break;
    }
    case 'human':
    default: {
      const formattedDrain = formatDrain(drain);
      console.table(formattedDrain);
    }
  }
}

export async function remove(options, drainId) {
  const { alias, app: appIdOrName } = options;

  const { ownerId, appId: applicationId } = await Application.resolveId(appIdOrName, alias);

  await deleteDrain({ ownerId, applicationId, drainId }).then(sendToApi);
  Logger.printSuccess(`Drain ${styleText(['bold', 'green'], drainId)} has been successfully removed!`);
}

export async function enable(options, drainId) {
  const { alias, app: appIdOrName } = options;

  const { ownerId, appId: applicationId } = await Application.resolveId(appIdOrName, alias);

  await enableDrain({ ownerId, applicationId, drainId }).then(sendToApi);

  Logger.printSuccess(`Drain ${styleText(['bold', 'green'], drainId)} has been successfully enabled!`);
}

export async function disable(options, drainId) {
  const { alias, app: appIdOrName } = options;

  const { ownerId, appId: applicationId } = await Application.resolveId(appIdOrName, alias);

  await disableDrain({ ownerId, applicationId, drainId }).then(sendToApi);

  Logger.printSuccess(`Drain ${styleText(['bold', 'green'], drainId)} has been successfully disabled!`);
}
