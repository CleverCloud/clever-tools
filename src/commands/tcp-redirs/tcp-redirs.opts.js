import { defineOption } from '../../lib/define-option.js';
import { completeNamespaces } from '../../models/namespaces.js';

export const namespaceOpt = defineOption({
  name: 'namespace',
  description: 'Namespace in which the TCP redirection should be',
  type: 'option',
  metavar: 'namespace',
  aliases: null,
  default: null,
  required: true,
  parser: null,
  complete: completeNamespaces,
});
