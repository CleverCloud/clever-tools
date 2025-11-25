import { commaSeparated as commaSeparatedParser } from '../../parsers.js';

export const featuresArg = {
  name: 'features',
  description: 'Comma-separated list of experimental features to manage',
  parser: commaSeparatedParser,
  complete: null
};

