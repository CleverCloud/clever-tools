import { defineOption } from '../../lib/define-option.js';

export const onlyAppsOpt = defineOption({
  name: 'only-apps',
  description: 'Only show app dependencies',
  type: 'flag',
  metavar: null,
  aliases: null,
  default: null,
  required: null,
  parser: null,
  complete: null,
});

export const onlyAddonsOpt = defineOption({
  name: 'only-addons',
  description: 'Only show add-on dependencies',
  type: 'flag',
  metavar: null,
  aliases: null,
  default: null,
  required: null,
  parser: null,
  complete: null,
});

export const showAllOpt = defineOption({
  name: 'show-all',
  description: 'Show all available add-ons and applications',
  type: 'flag',
  metavar: null,
  aliases: null,
  default: null,
  required: null,
  parser: null,
  complete: null,
});
