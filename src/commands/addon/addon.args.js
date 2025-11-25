import { defineArgument } from '../../lib/define-argument.js';

export const addonProviderArg = defineArgument({
  name: 'addon-provider',
  description: 'Add-on provider',
  parser: null,
  complete: null,
});

export const addonNameArg = defineArgument({
  name: 'addon-name',
  description: 'Add-on name',
  parser: null,
  complete: null,
});
