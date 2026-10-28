import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { createLogDrain, DRAIN_TYPES, resolveDrainResource } from '../../models/drain.js';
import { addonIdOrRealIdOption, aliasOption, appIdOrNameOption } from '../global.options.js';
import { drainUrlArg } from './drain.args.js';
import { drainKindOption } from './drain.options.js';

export const drainCreateSekoiaCommand = defineCommand({
  description: 'Create a Sekoia.io drain',
  since: null,
  options: {
    intakeKey: defineOption({
      name: 'intake-key',
      schema: z.string().min(1),
      description: 'Intake key',
      placeholder: 'intake-key',
    }),
    tlsVerification: defineOption({
      name: 'tls-verification',
      schema: z
        .enum(['default', 'trustful'])
        .transform((v) => v.toUpperCase())
        .optional(),
      description: 'TLS verification mode, use `trustful` for a self-hosted intake behind a private CA',
      placeholder: 'tls-verification',
    }),
    kind: drainKindOption,
    alias: aliasOption,
    appIdOrName: appIdOrNameOption,
    addonIdOrRealId: addonIdOrRealIdOption,
  },
  args: [drainUrlArg],
  async handler(options, url) {
    const { kind, alias, appIdOrName, addonIdOrRealId, intakeKey, tlsVerification } = options;
    const { ownerId, resourceId } = await resolveDrainResource(alias, appIdOrName, addonIdOrRealId);

    const drain = await createLogDrain(DRAIN_TYPES.SEKOIA.apiCode, kind, ownerId, resourceId, url, {
      intakeKey,
      tlsVerification,
    });

    Logger.printSuccess(
      `Sekoia.io drain ${styleText(['bold', 'green'], drain.id)} has been successfully created and enabled!`,
    );
  },
});
