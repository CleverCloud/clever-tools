import { z } from 'zod';
import { defineOption } from '../../lib/define-option.js';

export const ngResourceTypeOption = defineOption({
  name: 'type',
  schema: z.string().optional(),
  description: 'Type of resource to look for (NetworkGroup, Member, CleverPeer, ExternalPeer)',
  placeholder: 'resource-type',
});
