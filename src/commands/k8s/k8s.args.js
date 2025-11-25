import { defineArgument } from '../../lib/define-argument.js';
import { addonIdOrName as addonIdOrNameParser } from '../../parsers.js';

export const k8sIdOrNameArg = defineArgument({
  name: 'id-or-name',
  description: 'Kubernetes cluster ID or name',
  parser: addonIdOrNameParser,
  complete: null,
});
