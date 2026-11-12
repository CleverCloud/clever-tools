import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { restartApplication } from '../../lib/restart-application.js';
import {
  aliasOption,
  appIdOrNameOption,
  exitOnDeployOption,
  followDeployLogsOption,
  quietOption,
  restartCommitOption,
} from '../global.options.js';

export const restartCommand = defineCommand({
  description: 'Start or restart an application',
  since: '0.4.0',
  options: {
    commit: restartCommitOption,
    withoutCache: defineOption({
      name: 'without-cache',
      schema: z.boolean().default(false),
      description: 'Restart the application without using cache',
    }),
    alias: aliasOption,
    app: appIdOrNameOption,
    quiet: quietOption,
    follow: followDeployLogsOption,
    exitOnDeploy: exitOnDeployOption,
  },
  args: [],
  async handler(options) {
    return restartApplication(options);
  },
});
