import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';

export const configProviderIdOrNameArg = defineArgument({
  schema: z.string(),
  description: 'Add-on ID, real ID (config_xxx) or name (if unambiguous)',
  placeholder: 'addon-id|config-provider-id|addon-name',
});
