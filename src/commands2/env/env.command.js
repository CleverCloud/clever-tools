import {
  getAllEnvVars,
  getAllEnvVarsForAddons,
  getAllEnvVarsForDependencies,
} from '@clevercloud/client/esm/api/v2/application.js';
import { toNameEqualsValueString } from '@clevercloud/client/esm/utils/env-vars.js';
import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasOption, appIdOrNameOption, envFormatOption } from '../global.options.js';

export const envCommand = defineCommand({
  description: 'Manage environment variables of an application',
  since: '0.2.0',
  options: {
    addExportsOption: defineOption({
      name: 'add-export',
      schema: z.boolean().default(false),
      description: 'Display sourceable env variables setting',
      deprecated: 'use `--format shell` instead',
    }),
    alias: aliasOption,
    app: appIdOrNameOption,
    format: envFormatOption,
  },
  args: [],
  async handler(options) {
    const { alias, app: appIdOrName, addExportsOption, format } = options;
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
