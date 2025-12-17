import { z } from 'zod';
import { defineOption } from '../../lib/define-option.js';

export const sourceableEnvVarsListOption = defineOption({
  name: 'add-export',
  schema: z.boolean().default(false),
  description: 'Display sourceable env variables setting',
});
