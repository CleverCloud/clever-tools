import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { createLogDrain, resolveDrainResource } from '../../models/drain.js';
import { addonIdOrRealIdOption, aliasOption, appIdOrNameOption } from '../global.options.js';
import { drainUrlArg } from './drain.args.js';

export const drainCreateSplunkCommand = defineCommand({
  description: 'Create a Splunk HEC drain',
  since: null,
  options: {
    token: defineOption({
      name: 'hec-token',
      schema: z.string().min(1),
      description: 'HTTP Event Collector token',
      placeholder: 'hec-token',
    }),
    index: defineOption({
      name: 'index',
      schema: z.string().min(1).optional(),
      description: "Optional target index, the HEC token's own index is used if not set",
      placeholder: 'index',
    }),
    sourcetype: defineOption({
      name: 'sourcetype',
      schema: z.string().min(1).optional(),
      description: "Optional sourcetype, the HEC token's own sourcetype is used if not set",
      placeholder: 'sourcetype',
    }),
    tlsVerification: defineOption({
      name: 'tls-verification',
      schema: z
        .enum(['default', 'trustful'])
        .transform((v) => v.toUpperCase())
        .optional(),
      description: 'TLS verification mode, use `trustful` to accept a self-signed certificate',
      placeholder: 'tls-verification',
    }),
    alias: aliasOption,
    appIdOrName: appIdOrNameOption,
    addonIdOrRealId: addonIdOrRealIdOption,
  },
  args: [drainUrlArg],
  async handler(options, url) {
    const { alias, appIdOrName, addonIdOrRealId, token, index, sourcetype, tlsVerification } = options;
    const { ownerId, resourceId } = await resolveDrainResource(alias, appIdOrName, addonIdOrRealId);

    // `index` and `sourcetype` are left out when unset: a field sent in the payload overrides the setting bound to the HEC token
    const drain = await createLogDrain('SPLUNK', ownerId, resourceId, url, {
      token,
      index,
      sourcetype,
      tlsVerification,
    });

    Logger.printSuccess(
      `Splunk drain ${styleText(['bold', 'green'], drain.id)} has been successfully created and enabled!`,
    );
  },
});
