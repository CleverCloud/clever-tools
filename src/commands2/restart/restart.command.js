import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineFlag } from '../../lib/define-flag.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import * as ExitStrategy from '../../models/exit-strategy-option.js';
import * as git from '../../models/git.js';
import * as Log from '../../models/log-v4.js';
import { aliasFlag, appIdOrNameFlag, exitOnDeployFlag, followDeployLogsFlag, quietFlag } from '../global.flags.js';

export const restartCommand = defineCommand({
  description: 'Start or restart an application',
  flags: {
    commit: defineFlag({
      name: 'commit',
      schema: z.string().optional(),
      description: 'Restart the application with a specific commit ID',
      placeholder: 'commit id',
    }),
    'without-cache': defineFlag({
      name: 'without-cache',
      schema: z.boolean().default(false),
      description: 'Restart the application without using cache',
    }),
    alias: aliasFlag,
    app: appIdOrNameFlag,
    quiet: quietFlag,
    follow: followDeployLogsFlag,
    'exit-on': exitOnDeployFlag,
  },
  args: [],
  async handler(flags) {
    const {
      alias,
      app: appIdOrName,
      quiet,
      commit,
      'without-cache': withoutCache,
      follow,
      'exit-on': exitOnDeploy,
    } = flags;

    const exitStrategy = ExitStrategy.get(follow, exitOnDeploy);

    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
    const fullCommitId = await git.resolveFullCommitId(commit);
    const app = await Application.get(ownerId, appId);

    if (app == null) {
      throw new Error("The application doesn't exist");
    }

    const remoteCommitId = app.commitId;

    const commitId = fullCommitId || remoteCommitId;
    if (commitId != null) {
      const cacheSuffix = withoutCache ? ' without using cache' : '';
      Logger.println(
        `🔄 Restarting ${styleText('bold', app.name)}${cacheSuffix} ${styleText('grey', `(${commitId})`)}`,
      );
    }

    // This should be handled by the API when a deployment ID is set but we'll do this for now
    const redeployDate = new Date();

    const redeploy = await Application.redeploy(ownerId, appId, fullCommitId, withoutCache);

    return Log.watchDeploymentAndDisplayLogs({
      ownerId,
      appId,
      deploymentId: redeploy.deploymentId,
      quiet,
      redeployDate,
      exitStrategy,
    });
  },
});
