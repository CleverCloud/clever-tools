import { z } from 'zod';
import { defineOption } from '../../lib/define-option.js';
import { OAUTH_RIGHTS } from '../../models/oauth-consumer.js';

export const descriptionOption = defineOption({
  name: 'description',
  schema: z.string().trim().min(1).optional(),
  description: 'Consumer description',
  aliases: ['d'],
  placeholder: 'description',
});

export const urlOption = defineOption({
  name: 'url',
  schema: z.string().url().optional(),
  description: 'Application home URL',
  placeholder: 'url',
});

export const pictureOption = defineOption({
  name: 'picture',
  schema: z.string().url().optional(),
  description: 'Application logo URL',
  placeholder: 'url',
});

export const baseUrlOption = defineOption({
  name: 'base-url',
  schema: z.string().url().optional(),
  description: 'OAuth callback base URL',
  placeholder: 'url',
});

/** @type {[string, ...string[]]} */
const OAUTH_RIGHTS_WITH_ALL = [...Object.values(OAUTH_RIGHTS), 'all'];

const rightsSchema = z
  .string()
  .transform((s) => s.split(',').map((r) => r.trim()))
  .pipe(z.array(z.enum(OAUTH_RIGHTS_WITH_ALL)))
  .optional();

export const rightsOption = defineOption({
  name: 'rights',
  schema: rightsSchema,
  description: `Comma-separated list of rights (${OAUTH_RIGHTS_WITH_ALL.join(', ')})`,
  placeholder: 'rights',
});
