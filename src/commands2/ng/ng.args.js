import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { ngResourceType } from '../../parsers.js';

export const ngIdOrLabelArg = defineArgument({
  schema: z.string().transform(ngResourceType),
  description: 'Network Group ID or label',
  placeholder: 'ng-id|ng-label',
});

export const ngExternalIdOrLabelArg = defineArgument({
  schema: z.string().transform(ngResourceType),
  description: 'External peer ID or label',
  placeholder: 'peer-id|peer-label',
});

export const ngResourceIdArg = defineArgument({
  schema: z.string().transform(ngResourceType),
  description: 'ID of a resource to (un)link to a Network Group',
  placeholder: 'id',
});

export const ngAnyIdOrLabelArg = defineArgument({
  schema: z.string().transform(ngResourceType),
  description: 'ID or Label of a Network Group, a member or an (external) peer',
  placeholder: 'id|label',
});
