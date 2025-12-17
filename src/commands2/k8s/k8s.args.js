import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { addonIdOrName } from '../../parsers.js';

export const k8sIdOrNameArg = defineArgument({
  schema: z.string().transform(addonIdOrName),
  description: 'Kubernetes cluster ID or name',
  placeholder: 'cluster-id|cluster-name',
});
