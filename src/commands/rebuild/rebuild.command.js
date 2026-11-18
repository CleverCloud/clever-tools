import { defineCommand } from '../../lib/define-command.js';
import { restartApplication } from '../../lib/restart-application.js';
import {
  aliasOption,
  appIdOrNameOption,
  exitOnDeployOption,
  followDeployLogsOption,
  quietOption,
  restartCommitOption,
} from '../global.options.js';

export const rebuildCommand = defineCommand({
  description: 'Restart an application without using cache',
  since: null,
  options: {
    commit: restartCommitOption,
    alias: aliasOption,
    app: appIdOrNameOption,
    quiet: quietOption,
    follow: followDeployLogsOption,
    exitOnDeploy: exitOnDeployOption,
  },
  args: [],
  async handler(options) {
    return restartApplication({ ...options, withoutCache: true });
  },
});
