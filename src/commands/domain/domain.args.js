import { defineArgument } from '../../lib/define-argument.js';

export const fqdnArg = defineArgument({
  name: 'fqdn',
  description: 'Domain name of the application',
  parser: null,
  complete: null,
});
