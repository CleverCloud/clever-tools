import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';

export const resourceIdArg = defineArgument({
  schema: z.string(),
  description: 'Resource ID: application (app_xxx), add-on (addon_xxx or real ID), Kubernetes cluster or Network Group',
  placeholder: 'resource-id',
});

export const tagArg = defineArgument({
  // The API accepts any tag, commas and spaces included
  schema: z.string().min(1, 'Tag must not be empty'),
  description: 'Tag',
  placeholder: 'tag',
});
