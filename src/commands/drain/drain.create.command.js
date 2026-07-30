import { CreateLogDrainCommand } from '@clevercloud/client/cc-api-commands/log-drain/create-log-drain-command.js';
import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { clients } from '../../models/cc-api-client.js';
import { DRAIN_TYPE_CLI_CODES, DRAIN_TYPES, resolveDrainResource } from '../../models/drain.js';
import { addonIdOrRealIdOption, aliasOption, appIdOrNameOption } from '../global.options.js';

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
    sourceToken: defineOption({
      name: 'source-token',
      schema: z.string().optional(),
      description: 'Source token (for betterstack)',
      aliases: ['t'],
      placeholder: 'source-token',
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
    appIdOrName: appIdOrNameOption,
    addonIdOrRealId: addonIdOrRealIdOption,
  },
  args: [
    defineArgument({
      schema: z.enum(DRAIN_TYPE_CLI_CODES),
      description: 'Drain type',
      placeholder: 'drain-type',
    }),
    defineArgument({
      schema: z.string(),
      description: 'Drain URL',
      placeholder: 'drain-url',
    }),
  ],
  async handler(options, drainTypeCliCode, url) {
    const { alias, appIdOrName, addonIdOrRealId } = options;
    const { username, password, apiKey, sourceToken, indexPrefix, rfc5424StructuredDataParameters } = options;

    const drainType = Object.values(DRAIN_TYPES).find((drainType) => drainType.cliCode === drainTypeCliCode);

    const resource = await resolveDrainResource(alias, appIdOrName, addonIdOrRealId);

    const target = {
      type: drainType.apiCode,
      url,
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
      target.indexPrefix = indexPrefix;
    }

    if (drainTypeCliCode === DRAIN_TYPES.ELASTICSEARCH.cliCode || drainTypeCliCode === DRAIN_TYPES.RAW_HTTP.cliCode) {
      if (username || password) {
        target.credentials = { username: username || undefined, password: password || undefined };
      }
    }

    if (drainTypeCliCode === DRAIN_TYPES.NEWRELIC.cliCode) {
      if (!apiKey) {
        throw new Error(`${DRAIN_TYPES.NEWRELIC.cliCode} drains require an API key (--api-key) to be set`);
      }
      target.apiKey = apiKey;
    }

    if (drainTypeCliCode === DRAIN_TYPES.BETTERSTACK.cliCode) {
      if (!sourceToken) {
        throw new Error(`${DRAIN_TYPES.BETTERSTACK.cliCode} drains require a source token (--source-token) to be set`);
      }
      target.sourceToken = sourceToken;
    }

    if (
      drainTypeCliCode === DRAIN_TYPES.OVH_TCP.cliCode ||
      drainTypeCliCode === DRAIN_TYPES.SYSLOG_TCP.cliCode ||
      drainTypeCliCode === DRAIN_TYPES.SYSLOG_UDP.cliCode
    ) {
      if (rfc5424StructuredDataParameters) {
        target.rfc5424StructuredDataParameters = rfc5424StructuredDataParameters;
      }
    }

    const drain = await clients.ccApi.send(new CreateLogDrainCommand({ ...resource, kind: 'LOG', target }));
    Logger.printSuccess(`Drain ${styleText(['bold', 'green'], drain.id)} has been successfully created and enabled!`);
  },
});
