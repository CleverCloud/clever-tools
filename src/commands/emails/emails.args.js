import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';

export const emailArg = defineArgument({
  schema: z.string().email(),
  description: 'Email address',
  placeholder: 'email',
});
