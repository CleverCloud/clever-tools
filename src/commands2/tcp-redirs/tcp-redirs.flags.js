import { z } from 'zod';
import { defineFlag } from '../../lib/define-flag.js';
import { completeNamespaces } from '../../models/namespaces.js';

export const namespaceFlag = defineFlag({
  name: 'namespace',
  schema: z.string(),
  description: 'Namespace in which the TCP redirection should be',
  placeholder: 'namespace',
  complete: completeNamespaces,
});
