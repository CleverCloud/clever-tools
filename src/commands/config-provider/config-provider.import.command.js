import { UpdateConfigProviderCommand } from '@clevercloud/client/cc-api-commands/config-provider/update-config-provider-command.js';
import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { Logger } from '../../logger.js';
import { clients } from '../../models/cc-api-client.js';
import { resolveConfigProviderId } from '../../models/config-provider.js';
import * as variables from '../../models/variables.js';
import { configProviderIdOrNameArg } from './config-provider.args.js';

const importFormatOption = defineOption({
  name: 'format',
  schema: z.enum(['name-equals-value', 'json']).default('name-equals-value'),
  description: 'Input format',
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
    // but the client expects [{ name, value }] format
    const envVarsObject = await variables.readVariablesFromStdin(format);
    const envVarsArray = Object.entries(envVarsObject).map(([name, value]) => ({ name, value }));

    await clients.ccApi.send(new UpdateConfigProviderCommand({ addonId: realId, environment: envVarsArray }));

    Logger.println('Environment variables have been set');
  },
});
