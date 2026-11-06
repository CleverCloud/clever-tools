import { defineCommand } from '../../lib/define-command.js';
import { restartApplication, restartOptions } from '../restart/restart.command.js';

export const rebuildCommand = defineCommand({
  description: 'Restart an application without using cache',
  since: null,
  options: restartOptions,
  args: [],
  async handler(options) {
    return restartApplication({ ...options, withoutCache: true });
  },
});
