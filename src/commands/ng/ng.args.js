import { defineArgument } from '../../lib/define-argument.js';
import { ngResourceType as ngResourceTypeParser } from '../../parsers.js';

export const ngIdOrLabelArg = defineArgument({
  name: 'ng-id-or-label',
  description: 'Network Group ID or label',
  parser: ngResourceTypeParser,
  complete: null,
});

export const ngExternalIdOrLabelArg = defineArgument({
  name: 'external-peer-id-or-label',
  description: 'External peer ID or label',
  parser: ngResourceTypeParser,
  complete: null,
});

export const ngResourceIdArg = defineArgument({
  name: 'id',
  description: 'ID of a resource to (un)link to a Network Group',
  parser: ngResourceTypeParser,
  complete: null,
});

export const ngAnyIdOrLabelArg = defineArgument({
  name: 'id-or-label',
  description: 'ID or Label of a Network Group, a member or an (external) peer',
  parser: ngResourceTypeParser,
  complete: null,
});
