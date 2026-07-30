import { GetEnvironmentCommand } from '@clevercloud/client/cc-api-commands/environment/get-environment-command.js';
import { toNameEqualsValueString } from '@clevercloud/client/utils/environment-utils.js';
import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { clients } from '../../models/cc-api-client.js';
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

    const { environment, linkedApplicationsEnvironment, linkedAddonsEnvironment } = await clients.ccApi.send(
      new GetEnvironmentCommand({
        ownerId,
        applicationId: appId,
        includeLinkedApplications: true,
        includeLinkedAddons: true,
      }),
    );

    switch (format) {
      case 'json': {
        Logger.printJson({
          env: environment,
          fromAddons: linkedAddonsEnvironment.map((addon) => ({
            addonId: addon.addonId,
            addonName: addon.addonName,
            env: addon.environment,
          })),
          fromDependencies: linkedApplicationsEnvironment.map((dep) => ({
            addonId: dep.applicationId,
            addonName: dep.applicationName,
            env: dep.environment,
          })),
        });
        break;
      }
      case 'shell':
      case 'human':
      default: {
        const addExports = addExportsOption || format === 'shell';

        Logger.println('# Manually set env variables');
        Logger.println(toNameEqualsValueString(environment, { addExports }));

        linkedAddonsEnvironment.forEach((addon) => {
          Logger.println('# Addon ' + addon.addonName);
          Logger.println(toNameEqualsValueString(addon.environment, { addExports }));
        });

        linkedApplicationsEnvironment.forEach((dep) => {
          Logger.println('# Dependency ' + dep.applicationName);
          Logger.println(toNameEqualsValueString(dep.environment, { addExports }));
        });
      }
    }
  },
});
