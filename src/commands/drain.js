import { createDrain, deleteDrain, disableDrain, enableDrain, getDrain, getDrains } from '../clever-client/drains.js';
import { styleText } from '../lib/style-text.js';
import { Logger } from '../logger.js';
import * as Application from '../models/application.js';
import { formatDrain } from '../models/drain.js';
import { sendToApi } from '../models/send-to-api.js';

export const DRAIN_TYPES_OBJECT = {
  DATADOG: 'DatadogRecipient',
  ELASTICSEARCH: 'ElasticsearchRecipient',
  NEWRELIC: 'NewRelicRecipient',
  OVH_TCP: 'OVHTCPRecipient',
  RAW_HTTP: 'RawRecipient',
  SYSLOG_TCP: 'SyslogTCPRecipient',
  SYSLOG_UDP: 'SyslogUDPRecipient',
};

export const DRAIN_TYPES = Object.values(DRAIN_TYPES_OBJECT);

export async function list(params) {
  const { alias, app: appIdOrName, format } = params.options;

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

export async function create(params) {
  const { alias, app: appIdOrName } = params.options;
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

  const { ownerId, appId: applicationId } = await Application.resolveId(appIdOrName, alias);

  const body = {
    kind: 'LOG',
    recipient: {
      type,
      url,
    },
  };

  if (type === DRAIN_TYPES_OBJECT.ELASTICSEARCH) {
    if (!indexPrefix) {
      throw new Error(`${DRAIN_TYPES_OBJECT.ELASTICSEARCH} drains require an index prefix (--index-prefix) to be set`);
    }
    if (!url.endsWith('/_bulk')) {
      throw new Error(`${DRAIN_TYPES_OBJECT.ELASTICSEARCH} drain URL must end with '/_bulk'`);
    }
    body.recipient.indexPrefix = indexPrefix;
  }

  if (type === DRAIN_TYPES_OBJECT.ELASTICSEARCH || type === DRAIN_TYPES_OBJECT.RAW_HTTP) {
    if (username) {
      body.recipient.username = username;
    }
    if (password) {
      body.recipient.password = password;
    }
  }

  if (type === DRAIN_TYPES_OBJECT.NEWRELIC) {
    // TODO error if not present ?
    if (apiKey) {
      body.recipient.apiKey = apiKey;
    }
  }

  if (type === DRAIN_TYPES_OBJECT.OVH_TCP) {
    if (!rfc5424StructuredDataParameters) {
      throw new Error(
        `${DRAIN_TYPES_OBJECT.OVH_TCP} drains require RFC5424 structured data parameters (--sd-params) to be set`,
      );
    }
    body.recipient.rfc5424StructuredDataParameters = rfc5424StructuredDataParameters;
  }

  const drain = await createDrain({ ownerId, applicationId, body }).then(sendToApi);
  Logger.printSuccess(`Drain ${styleText(['bold', 'green'], drain.id)} has been successfully created and enabled!`);
}

export async function get(params) {
  const [drainId] = params.args;
  const { alias, app: appIdOrName, format } = params.options;

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

export async function remove(params) {
  const [drainId] = params.args;
  const { alias, app: appIdOrName } = params.options;

  const { ownerId, appId: applicationId } = await Application.resolveId(appIdOrName, alias);

  await deleteDrain({ ownerId, applicationId, drainId }).then(sendToApi);
  Logger.printSuccess(`Drain ${styleText(['bold', 'green'], drainId)} has been successfully removed!`);
}

export async function enable(params) {
  const [drainId] = params.args;
  const { alias, app: appIdOrName } = params.options;

  const { ownerId, appId: applicationId } = await Application.resolveId(appIdOrName, alias);

  await enableDrain({ ownerId, applicationId, drainId }).then(sendToApi);

  Logger.printSuccess(`Drain ${styleText(['bold', 'green'], drainId)} has been successfully enabled!`);
}

export async function disable(params) {
  const [drainId] = params.args;
  const { alias, app: appIdOrName } = params.options;

  const { ownerId, appId: applicationId } = await Application.resolveId(appIdOrName, alias);

  await disableDrain({ ownerId, applicationId, drainId }).then(sendToApi);

  Logger.printSuccess(`Drain ${styleText(['bold', 'green'], drainId)} has been successfully disabled!`);
}
