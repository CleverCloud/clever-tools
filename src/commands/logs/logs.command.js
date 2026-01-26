import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { resolveOwnerId, resolveRealId } from '../../models/ids-resolver.js';
import * as Log from '../../models/log-v4.js';
import { Deferred } from '../../models/utils.js';
import {
  addonIdOption,
  afterOption,
  aliasOption,
  appIdOrNameOption,
  beforeOption,
  logsFormatOption,
} from '../global.options.js';

export const logsCommand = defineCommand({
  description: 'Fetch application logs, continuously',
  since: '0.2.0',
  options: {
    search: defineOption({
      name: 'search',
      schema: z.string().optional(),
      description: 'Fetch logs matching this pattern',
      placeholder: 'search',
    }),
    deploymentId: defineOption({
      name: 'deployment-id',
      schema: z.string().optional(),
      description: 'Fetch logs for a given deployment',
      placeholder: 'deployment-id',
    }),
    alias: aliasOption,
    app: appIdOrNameOption,
    before: beforeOption,
    after: afterOption,
    addon: addonIdOption,
    format: logsFormatOption,
  },
  args: [],
  async handler(options) {
    const {
      alias,
      app: appIdOrName,
      addon: addonIdOrRealId,
      after: since,
      before: until,
      search,
      deploymentId,
      format,
    } = options;

    // ignore --search ""
    const filter = search !== '' ? search : null;
    const isForHuman = format === 'human';

    if (addonIdOrRealId != null) {
      const realId = await resolveRealId(addonIdOrRealId);
      const ownerId = await resolveOwnerId(realId);
      if (isForHuman) {
        Logger.println(styleText('blue', 'Waiting for addon logs…'));
      }
      const deferred = new Deferred();
      await Log.displayLogs({ ownerId, addonId: realId, since, until, filter, format, deferred });
      return deferred.promise;
    }

    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    if (isForHuman) {
      Logger.println(styleText('blue', 'Waiting for application logs…'));
    }

    const deferred = new Deferred();
    await Log.displayLogs({ ownerId, appId, since, until, filter, deploymentId, format, deferred });
    return deferred.promise;
  },
});
