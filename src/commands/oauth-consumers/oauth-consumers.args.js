import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';

export const consumerKeyOrNameArg = defineArgument({
  schema: z.string(),
  description: 'OAuth consumer key (or name, if unambiguous)',
  placeholder: 'consumer-key|consumer-name',
});
