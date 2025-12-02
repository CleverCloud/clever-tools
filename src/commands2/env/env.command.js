import {
  getAllEnvVars,
  getAllEnvVarsForAddons,
  getAllEnvVarsForDependencies,
} from '@clevercloud/client/esm/api/v2/application.js';
import { toNameEqualsValueString } from '@clevercloud/client/esm/utils/env-vars.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasFlag, appIdOrNameFlag, envFormatFlag } from '../global.flags.js';
import { sourceableEnvVarsListFlag } from './env.flags.js';

export const envCommand = defineCommand({
  description: 'Manage environment variables of an application',
  flags: {
    'add-export': sourceableEnvVarsListFlag,
    alias: aliasFlag,
    app: appIdOrNameFlag,
    format: envFormatFlag,
  },
  args: [],
  async handler(flags) {
    const { alias, app: appIdOrName, 'add-export': addExportsOption, format } = flags;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    const [envFromApp, envFromAddons, envFromDeps] = await Promise.all([
      getAllEnvVars({ id: ownerId, appId }).then(sendToApi),
      getAllEnvVarsForAddons({ id: ownerId, appId }).then(sendToApi),
      getAllEnvVarsForDependencies({ id: ownerId, appId }).then(sendToApi),
    ]);

    switch (format) {
      case 'json': {
        Logger.printJson({
          env: envFromApp,
          fromAddons: envFromAddons.map((addon) => ({
            addonId: addon.addon_id,
            addonName: addon.addon_name,
            env: addon.env,
          })),
          fromDependencies: envFromDeps.map((dep) => ({
            addonId: dep.app_id,
            addonName: dep.app_name,
            env: dep.env,
          })),
        });
        break;
      }
      case 'shell':
      case 'human':
      default: {
        if (addExportsOption) {
          Logger.println(styleText('yellow', '`--add-export` option is deprecated. Use `--format shell` instead.'));
        }

        const addExports = addExportsOption || format === 'shell';

        Logger.println('# Manually set env variables');
        Logger.println(toNameEqualsValueString(envFromApp, { addExports }));

        envFromAddons.forEach((addon) => {
          Logger.println('# Addon ' + addon.addon_name);
          Logger.println(toNameEqualsValueString(addon.env, { addExports }));
        });

        envFromDeps.forEach((dep) => {
          Logger.println('# Dependency ' + dep.app_name);
          Logger.println(toNameEqualsValueString(dep.env, { addExports }));
        });
      }
    }
  },
});
