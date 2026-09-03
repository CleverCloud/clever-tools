import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';

export const drainIdArg = defineArgument({
  schema: z.string(),
  description: 'Drain ID',
  placeholder: 'drain-id',
});

export const drainUrlArg = defineArgument({
  schema: z.string(),
  description: 'Drain URL',
  placeholder: 'drain-url',
});
