import { z } from 'zod';
import { createDrain } from '../../clever-client/drains.js';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { DRAIN_TYPE_CLI_CODES, DRAIN_TYPES } from '../../models/drain.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';

export const drainCreateCommand = defineCommand({
  description: 'Create a drain',
  since: '0.9.0',
  options: {
    username: defineOption({
      name: 'username',
      schema: z.string().optional(),
      description: 'Basic auth username (for elasticsearch or raw-http)',
      aliases: ['u'],
      placeholder: 'username',
    }),
    password: defineOption({
      name: 'password',
      schema: z.string().optional(),
      description: 'Basic auth password (for elasticsearch or raw-http)',
      aliases: ['p'],
      placeholder: 'password',
    }),
    apiKey: defineOption({
      name: 'api-key',
      schema: z.string().optional(),
      description: 'API key (for newrelic)',
      aliases: ['k'],
      placeholder: 'api-key',
    }),
    indexPrefix: defineOption({
      name: 'index-prefix',
      schema: z.string().optional(),
      description: 'Optional index prefix (for elasticsearch), `logstash` value is used if not set',
      aliases: ['i'],
      placeholder: 'index-prefix',
    }),
    rfc5424StructuredDataParameters: defineOption({
      name: 'sd-params',
      schema: z.string().optional(),
      description: 'RFC5424 structured data parameters (for ovh-tcp), e.g.: `X-OVH-TOKEN=\\\"REDACTED\\\"`',
      aliases: ['s'],
      placeholder: 'sd-params',
    }),
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [
    defineArgument({
      schema: z.string(),
      description: 'No description available',
      placeholder: 'drain-type',
      complete: DRAIN_TYPE_CLI_CODES,
    }),
    defineArgument({
      schema: z.string(),
      description: 'Drain URL',
      placeholder: 'drain-url',
    }),
  ],
  async handler(options, drainTypeCliCode, url) {
    const { alias, app: appIdOrName } = options;
    const { username, password, apiKey, indexPrefix, rfc5424StructuredDataParameters } = options;

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
        throw new Error(
          `${DRAIN_TYPES.ELASTICSEARCH.cliCode} drains require an index prefix (--index-prefix) to be set`,
        );
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
  },
});
