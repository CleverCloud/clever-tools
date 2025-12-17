import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';

export const addonProviderArg = defineArgument({
  schema: z.string(),
  description: 'Add-on provider',
  placeholder: 'addon-provider',
});

export const addonNameArg = defineArgument({
  schema: z.string(),
  description: 'Add-on name',
  placeholder: 'addon-name',
});
