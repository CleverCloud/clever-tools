import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';

export const resourceIdArg = defineArgument({
  schema: z.string(),
  description: 'Resource ID: application (app_xxx), add-on (addon_xxx or real ID), Kubernetes cluster or Network Group',
  placeholder: 'resource-id',
});
