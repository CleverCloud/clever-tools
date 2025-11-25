import { defineArgument } from '../../lib/define-argument.js';

export const drainIdArg = defineArgument({
  name: 'drain-id',
  description: 'Drain ID',
  parser: null,
  complete: null,
});
