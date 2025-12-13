import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { listAvailableIds } from '../../models/application_configuration.js';

export const configurationNameArg = defineArgument({
  schema: z.string(),
  description: `Configuration to manage: ${listAvailableIds(true)}`,
  placeholder: 'configuration-name',
  complete: listAvailableIds,
});
