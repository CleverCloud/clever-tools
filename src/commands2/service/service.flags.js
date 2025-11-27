import { z } from 'zod';
import { defineFlag } from '../../lib/define-flag.js';

export const onlyAppsFlag = defineFlag({
  name: 'only-apps',
  schema: z.boolean().default(false),
  description: 'Only show app dependencies',
});

export const onlyAddonsFlag = defineFlag({
  name: 'only-addons',
  schema: z.boolean().default(false),
  description: 'Only show add-on dependencies',
});

export const showAllFlag = defineFlag({
  name: 'show-all',
  schema: z.boolean().default(false),
  description: 'Show all available add-ons and applications',
});
