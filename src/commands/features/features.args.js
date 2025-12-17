import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { commaSeparated } from '../../parsers.js';

export const featuresArg = defineArgument({
  schema: z.string().transform(commaSeparated),
  description: 'Comma-separated list of experimental features to manage',
  placeholder: 'features',
});
