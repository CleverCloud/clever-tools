import { addonIdOrName as addonIdOrNameParser } from '../../parsers.js';

export const k8sIdOrNameArg = {
  name: 'id-or-name',
  description: 'Kubernetes cluster ID or name',
  parser: addonIdOrNameParser,
  complete: null
};

