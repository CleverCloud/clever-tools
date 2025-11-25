import { defineArgument } from '../../lib/define-argument.js';

export const sshKeyNameArg = defineArgument({
  name: 'ssh-key-name',
  description: 'SSH key name',
  parser: null,
  complete: null,
});
