import { updateConfigProviderEnv } from '@clevercloud/client/esm/api/v4/addon.js';
import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { Logger } from '../../logger.js';
import { resolveConfigProviderId } from '../../models/config-provider.js';
import { sendToApi } from '../../models/send-to-api.js';
import * as variables from '../../models/variables.js';
import { configProviderIdOrNameArg } from './config-provider.args.js';

const importFormatOption = defineOption({
  name: 'format',
  schema: z.enum(['name-equals-value', 'json']).default('name-equals-value'),
  description: 'Input format (name-equals-value, json)',
  aliases: ['F'],
  placeholder: 'format',
});

export const configProviderImportCommand = defineCommand({
  description:
    'Load environment variables from STDIN\n(WARNING: this deletes all current variables and replaces them with the new list loaded from STDIN)',
  since: '4.6.0',
  options: {
    format: importFormatOption,
  },
  args: [configProviderIdOrNameArg],
  async handler(options, addonIdOrRealIdOrName) {
    const { format } = options;
    const { realId } = await resolveConfigProviderId(addonIdOrRealIdOrName);

    // readVariablesFromStdin returns { NAME: "value" } format
    // but the API expects [{ name, value }] format
    const envVarsObject = await variables.readVariablesFromStdin(format);
    const envVarsArray = Object.entries(envVarsObject).map(([name, value]) => ({ name, value }));

    await updateConfigProviderEnv({ configurationProviderId: realId }, envVarsArray).then(sendToApi);

    Logger.println('Environment variables have been set');
  },
});
