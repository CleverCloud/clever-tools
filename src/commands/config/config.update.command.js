import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import * as Application from '../../models/application.js';
import * as ApplicationConfiguration from '../../models/application_configuration.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';

export const configUpdateCommand = defineCommand({
  description: 'Edit multiple configuration settings at once',
  since: '2.5.0',
  options: {
    alias: aliasOption,
    appIdOrName: appIdOrNameOption,
    name: defineOption({
      name: 'name',
      schema: z.string().optional(),
      description: 'Set application name',
    }),
    description: defineOption({
      name: 'description',
      schema: z.string().optional(),
      description: 'Set application description',
    }),
    enableZeroDowntime: defineOption({
      name: 'enable-zero-downtime',
      schema: z.boolean().default(false),
      description: 'Enable zero-downtime deployment',
    }),
    disableZeroDowntime: defineOption({
      name: 'disable-zero-downtime',
      schema: z.boolean().default(false),
      description: 'Disable zero-downtime deployment',
    }),
    enableStickySessions: defineOption({
      name: 'enable-sticky-sessions',
      schema: z.boolean().default(false),
      description: 'Enable sticky sessions',
    }),
    disableStickySessions: defineOption({
      name: 'disable-sticky-sessions',
      schema: z.boolean().default(false),
      description: 'Disable sticky sessions',
    }),
    enableCancelOnPush: defineOption({
      name: 'enable-cancel-on-push',
      schema: z.boolean().default(false),
      description: 'Enable cancel on push',
    }),
    disableCancelOnPush: defineOption({
      name: 'disable-cancel-on-push',
      schema: z.boolean().default(false),
      description: 'Disable cancel on push',
    }),
    enableForceHttps: defineOption({
      name: 'enable-force-https',
      schema: z.boolean().default(false),
      description: 'Enable force HTTPS redirection',
    }),
    disableForceHttps: defineOption({
      name: 'disable-force-https',
      schema: z.boolean().default(false),
      description: 'Disable force HTTPS redirection',
    }),
    enableTask: defineOption({
      name: 'enable-task',
      schema: z.boolean().default(false),
      description: 'Enable application as Clever Task',
    }),
    disableTask: defineOption({
      name: 'disable-task',
      schema: z.boolean().default(false),
      description: 'Disable application as Clever Task',
    }),
  },
  async handler(options) {
    const { alias, appIdOrName, ...rawOptions } = options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
    const newOptions = ApplicationConfiguration.parseOptions(rawOptions);

    if (Object.keys(newOptions).length === 0) {
      throw new Error('No configuration to update');
    }

    const app = await Application.updateOptions(ownerId, appId, newOptions);

    ApplicationConfiguration.printAllValues(app);
  },
});
