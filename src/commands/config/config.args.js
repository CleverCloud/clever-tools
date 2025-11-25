export const configurationNameArg = {
  name: 'configuration-name',
  description: 'Configuration to manage: ${...}',
  parser: null,
  complete: 'cliparse.autocomplete.words(ApplicationConfiguration.listAvailableIds())'
};

