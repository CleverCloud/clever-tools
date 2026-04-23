import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { createFunction } from '../../clever-client/functions.js';
import { getOwnerIdFromOrgIdOrName } from '../../models/ids-resolver.js';
import { sendToApi } from '../../models/send-to-api.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption } from '../global.options.js';

const DEFAULT_MAX_INSTANCES = 1;
const DEFAULT_MAX_MEMORY = 512 * 1024 * 1024;

export const functionsCreateCommand = defineCommand({
  description: 'Create a Clever Cloud Function',
  since: '4.9.0',
  options: {
    org: orgaIdOrNameOption,
    format: humanJsonOutputFormatOption,
    name: defineOption({
      name: 'name',
      schema: z.string().optional(),
      description: 'Function name',
      aliases: ['n'],
      placeholder: 'name',
    }),
    maxInstances: defineOption({
      name: 'max-instances',
      schema: z.number().int().min(1).default(DEFAULT_MAX_INSTANCES),
      description: 'Maximum number of concurrent instances',
      placeholder: 'count',
    }),
    maxMemory: defineOption({
      name: 'max-memory',
      schema: z.number().int().min(1).default(DEFAULT_MAX_MEMORY),
      description: 'Maximum memory per instance in bytes',
      placeholder: 'bytes',
    }),
  },
  args: [],
  async handler(options) {
    const { org, format, name, maxInstances, maxMemory } = options;
    const ownerId = await getOwnerIdFromOrgIdOrName(org);

    const fn = await createFunction(
      { ownerId },
      {
        name: name ?? null,
        environment: {},
        maxInstances,
        maxMemory,
      },
    ).then(sendToApi);

    if (format === 'json') {
      Logger.printJson(fn);
      return;
    }

    Logger.printSuccess(`Function ${styleText('green', fn.id)} created`);
    Logger.println(`  Deploy code to it with: ${styleText('blue', `clever functions deploy ${fn.id} <file>`)}`);
  },
});
