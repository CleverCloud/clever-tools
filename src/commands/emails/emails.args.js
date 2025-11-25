import { email as emailParser } from '../../parsers.js';

export const emailArg = {
  name: 'email',
  description: 'Email address',
  parser: emailParser,
  complete: null,
};
