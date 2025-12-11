import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';

export const featuresArg = defineArgument({
  schema: z.string(),
  description: 'Comma-separated list of experimental features to manage',
  placeholder: 'features',
});
