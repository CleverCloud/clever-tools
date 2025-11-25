import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import * as ExitStrategy from '../../models/exit-strategy-option.js';
import * as git from '../../models/git.js';
import * as Log from '../../models/log-v4.js';
import {
  aliasOpt,
  appIdOrNameOpt,
  colorOpt,
  exitOnDeployOpt,
  followDeployLogsOpt,
  quietOpt,
  updateNotifierOpt,
  verboseOpt,
} from '../global.opts.js';

export const restartCommand = defineCommand({
  name: 'restart',
  description: 'Start or restart an application',
  experimental: false,
  featureFlag: null,
  opts: {
    commit: defineOption({
      name: 'commit',
      description: 'Restart the application with a specific commit ID',
      type: 'option',
      metavar: 'commit id',
      aliases: null,
      default: null,
      required: null,
      parser: null,
      complete: null,
    }),
    'without-cache': defineOption({
      name: 'without-cache',
      description: 'Restart the application without using cache',
      type: 'flag',
      metavar: null,
      aliases: null,
      default: null,
      required: null,
      parser: null,
      complete: null,
    }),
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    alias: aliasOpt,
    app: appIdOrNameOpt,
    quiet: quietOpt,
    follow: followDeployLogsOpt,
    'exit-on': exitOnDeployOpt,
  },
  args: [],
  async execute(params) {
    const {
      alias,
      app: appIdOrName,
      quiet,
      commit,
      'without-cache': withoutCache,
      follow,
      'exit-on': exitOnDeploy,
    } = params.options;

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
