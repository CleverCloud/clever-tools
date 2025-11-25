import { defineArgument } from '../../lib/define-argument.js';

export const configurationNameArg = defineArgument({
  name: 'configuration-name',
  description: 'Configuration to manage: ${...}',
  parser: null,
  complete: 'cliparse.autocomplete.words(ApplicationConfiguration.listAvailableIds())',
});
