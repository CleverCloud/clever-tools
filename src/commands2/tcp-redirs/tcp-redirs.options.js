import { z } from 'zod';
import { defineOption } from '../../lib/define-option.js';
import { completeNamespaces } from '../../models/namespaces.js';

export const namespaceOption = defineOption({
  name: 'namespace',
  schema: z.string(),
  description: 'Namespace in which the TCP redirection should be',
  placeholder: 'namespace',
  complete: completeNamespaces,
});
