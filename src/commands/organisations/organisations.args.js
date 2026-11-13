import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { orgaIdOrName } from '../../parsers.js';

export const orgaIdOrNameArg = defineArgument({
  schema: z.string().transform(orgaIdOrName),
  description: 'Organisation ID (or exact name, if unambiguous)',
  placeholder: 'org-id|org-name',
});
