import { z } from 'zod';
import { defineOption } from '../../lib/define-option.js';

export const onlyAppsOption = defineOption({
  name: 'only-apps',
  schema: z.boolean().default(false),
  description: 'Only show app dependencies',
});

export const onlyAddonsOption = defineOption({
  name: 'only-addons',
  schema: z.boolean().default(false),
  description: 'Only show add-on dependencies',
});

export const showAllOption = defineOption({
  name: 'show-all',
  schema: z.boolean().default(false),
  description: 'Show all available add-ons and applications',
});
