import { z } from 'zod';
import { defineFlag } from '../../lib/define-flag.js';

export const ngResourceTypeFlag = defineFlag({
  name: 'type',
  schema: z.string().optional(),
  description: 'Type of resource to look for (NetworkGroup, Member, CleverPeer, ExternalPeer)',
  placeholder: 'type',
});
