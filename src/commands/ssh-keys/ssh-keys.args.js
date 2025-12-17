import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';

export const sshKeyNameArg = defineArgument({
  schema: z.string(),
  description: 'SSH key name',
  placeholder: 'ssh-key-name',
});
