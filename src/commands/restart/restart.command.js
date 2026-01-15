import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import * as ExitStrategy from '../../models/exit-strategy-option.js';
import { GitIsomorphic } from '../../models/git-isomorphic.js';
import * as Log from '../../models/log-v4.js';
import {
  aliasOption,
  appIdOrNameOption,
  exitOnDeployOption,
  followDeployLogsOption,
  quietOption,
} from '../global.options.js';

export const restartCommand = defineCommand({
  description: 'Start or restart an application',
  since: '0.4.0',
  options: {
    commit: defineOption({
      name: 'commit',
      schema: z.string().optional(),
      description: 'Restart the application with a specific commit ID',
      placeholder: 'commit-id',
    }),
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
    const { alias, app: appIdOrName, quiet, commit, withoutCache, follow, exitOnDeploy } = options;

    const exitStrategy = ExitStrategy.get(follow, exitOnDeploy);

    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
    const git = new GitIsomorphic();
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
