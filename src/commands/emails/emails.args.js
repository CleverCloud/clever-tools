import { defineArgument } from '../../lib/define-argument.js';
import { email as emailParser } from '../../parsers.js';

export const emailArg = defineArgument({
  name: 'email',
  description: 'Email address',
  parser: emailParser,
  complete: null,
});
