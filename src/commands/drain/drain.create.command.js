import { colorOpt, updateNotifierOpt, verboseOpt, aliasOpt, appIdOrNameOpt } from '../global.opts.js';
import { DRAIN_TYPE_CLI_CODES } from '../../models/drain.js';
import { createDrain, deleteDrain, disableDrain, enableDrain, getDrain, getDrains } from '../../clever-client/drains.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { DRAIN_TYPE_CLI_CODES, DRAIN_TYPES, formatDrain } from '../../models/drain.js';
import { sendToApi } from '../../models/send-to-api.js';

export const drainCreateCommand = {
  name: 'create',
  description: 'Create a drain',
  experimental: false,
  featureFlag: null,
  opts: {
    username: {
      name: 'username',
      description: 'Basic auth username (for elasticsearch or raw-http)',
      type: 'option',
      metavar: 'username',
      aliases: ['u'],
      default: null,
      required: null,
      parser: null,
      complete: null
    },
    password: {
      name: 'password',
      description: 'Basic auth password (for elasticsearch or raw-http)',
      type: 'option',
      metavar: 'password',
      aliases: ['p'],
      default: null,
      required: null,
      parser: null,
      complete: null
    },
    'api-key': {
      name: 'api-key',
      description: 'API key (for newrelic)',
      type: 'option',
      metavar: 'api_key',
      aliases: ['k'],
      default: null,
      required: null,
      parser: null,
      complete: null
    },
    'index-prefix': {
      name: 'index-prefix',
      description: 'Optional index prefix (for elasticsearch), `logstash` value is used if not set',
      type: 'option',
      metavar: 'index_prefix',
      aliases: ['i'],
      default: null,
      required: null,
      parser: null,
      complete: null
    },
    'sd-params': {
      name: 'sd-params',
      description: 'RFC5424 structured data parameters (for ovh-tcp), e.g.: `X-OVH-TOKEN=\\\"REDACTED\\\"`',
      type: 'option',
      metavar: 'sd_params',
      aliases: ['s'],
      default: null,
      required: null,
      parser: null,
      complete: null
    },
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    alias: aliasOpt,
    app: appIdOrNameOpt
  },
  args: [
    {
      name: 'drain-type',
      description: 'No description available',
      parser: null,
      complete: DRAIN_TYPE_CLI_CODES
    },
    {
      name: 'drain-url',
      description: 'Drain URL',
      parser: null,
      complete: null
    },
  ],
  async execute(params) {
    const { alias, app: appIdOrName } = params.options;
      const {
        username,
        password,
        'api-key': apiKey,
        'index-prefix': indexPrefix,
        'sd-params': rfc5424StructuredDataParameters,
      } = params.options;
      const [drainTypeCliCode, url] = params.args;
    
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
};
