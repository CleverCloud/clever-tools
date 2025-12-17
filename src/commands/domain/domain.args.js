import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';

export const fqdnArg = defineArgument({
  schema: z.string(),
  description: 'Domain name of the application',
  placeholder: 'fqdn',
});
