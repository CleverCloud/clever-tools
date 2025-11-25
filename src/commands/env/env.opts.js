import { defineOption } from '../../lib/define-option.js';

export const sourceableEnvVarsListOpt = defineOption({
  name: 'add-export',
  description: 'Display sourceable env variables setting',
  type: 'flag',
  metavar: null,
  aliases: null,
  default: null,
  required: null,
  parser: null,
  complete: null,
});
