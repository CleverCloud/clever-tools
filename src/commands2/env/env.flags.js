import { z } from 'zod';
import { defineFlag } from '../../lib/define-flag.js';

export const sourceableEnvVarsListFlag = defineFlag({
  name: 'add-export',
  schema: z.boolean().default(false),
  description: 'Display sourceable env variables setting',
});
