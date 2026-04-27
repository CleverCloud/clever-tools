import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { addonIdOrName } from '../../parsers.js';

export const k8sIdOrNameArg = defineArgument({
  schema: z.string().transform(addonIdOrName),
  description: 'Kubernetes cluster ID or name',
  placeholder: 'cluster-id|cluster-name',
});

export const k8sNodeGroupIdOrNameArg = defineArgument({
  schema: z.string(),
  description: 'Kubernetes node group ID or name',
  placeholder: 'nodegroup-id|nodegroup-name',
});
