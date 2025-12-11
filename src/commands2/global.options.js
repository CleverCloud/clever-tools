import { z } from 'zod';
import { defineOption } from '../lib/define-option.js';
import { listAvailableAliases } from '../models/application.js';
import { listMetaEvents } from '../models/notification.js';
import { appIdOrName, date, orgaIdOrName } from '../parsers.js';

export const aliasOption = defineOption({
  name: 'alias',
  schema: z.string().optional(),
  description: 'Short name for the application',
  aliases: ['a'],
  placeholder: 'alias',
  complete: listAvailableAliases,
});

export const appIdOrNameOption = defineOption({
  name: 'app',
  schema: z.string().transform(appIdOrName).optional(),
  description: 'Application to manage by its ID (or name, if unambiguous)',
  placeholder: 'app-id|app-name',
});

export const logsFormatOption = defineOption({
  name: 'format',
  schema: z.string().default('human'),
  description: 'Output format (${...})',
  aliases: ['F'],
  placeholder: 'format',
});

export const beforeOption = defineOption({
  name: 'before',
  schema: z.string().transform(date).optional(),
  description: 'Fetch logs before this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h)',
  aliases: ['until'],
  placeholder: 'before',
});

export const afterOption = defineOption({
  name: 'after',
  schema: z.string().transform(date).optional(),
  description: 'Fetch logs after this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h)',
  aliases: ['since'],
  placeholder: 'after',
});

export const addonIdOption = defineOption({
  name: 'addon',
  schema: z.string().optional(),
  description: 'Add-on ID',
  placeholder: 'addon-id',
});

export const orgaIdOrNameOption = defineOption({
  name: 'org',
  schema: z.string().transform(orgaIdOrName).optional(),
  description: 'Organisation to target by its ID (or name, if unambiguous)',
  aliases: ['o', 'owner'],
  placeholder: 'org-id|org-name',
});

export const humanJsonOutputFormatOption = defineOption({
  name: 'format',
  schema: z.string().default('human'),
  description: 'Output format (${...})',
  aliases: ['F'],
  placeholder: 'format',
});

export const confirmAddonDeletionOption = defineOption({
  name: 'yes',
  schema: z.boolean().default(false),
  description: 'Skip confirmation and delete the add-on directly',
  aliases: ['y'],
});

export const envFormatOption = defineOption({
  name: 'format',
  schema: z.string().default('human'),
  description: 'Output format (${...})',
  aliases: ['F'],
  placeholder: 'format',
});

export const aliasCreationOption = defineOption({
  name: 'alias',
  schema: z.string().optional(),
  description: 'Short name for the application',
  aliases: ['a'],
  placeholder: 'alias',
});

export const quietOption = defineOption({
  name: 'quiet',
  schema: z.boolean().default(false),
  description: "Don't show logs during deployment",
  aliases: ['q'],
});

export const followDeployLogsOption = defineOption({
  name: 'follow',
  schema: z.boolean().default(false),
  description: 'Continue to follow logs after deployment has ended',
});

export const exitOnDeployOption = defineOption({
  name: 'exit-on',
  schema: z.string().default('deploy-end'),
  description: 'Step at which the logs streaming is ended, steps are: ${...}',
  aliases: ['e'],
  placeholder: 'step',
});

export const importAsJsonOption = defineOption({
  name: 'json',
  schema: z.boolean().default(false),
  description: 'Import variables as JSON (an array of { \"name\": \"THE_NAME\", \"value\": \"THE_VALUE\" } objects)',
});

export const targetVersionOption = defineOption({
  name: 'target',
  schema: z.string().optional(),
  description: 'Target version to upgrade to (e.g.: 24, 2.4, 2.4.1)',
  placeholder: 'version',
});

export const listAllNotificationsOption = defineOption({
  name: 'list-all',
  schema: z.boolean().default(false),
  description: "List all notifications for your user or for an organisation with the '--org' option",
});

export const notificationEventTypeOption = defineOption({
  name: 'event',
  schema: z
    .string()
    .transform((v) => v.split(','))
    .optional(),
  description: 'Restrict notifications to specific event types',
  placeholder: 'event-type',
  complete: listMetaEvents,
});

export const notificationScopeOption = defineOption({
  name: 'service',
  schema: z
    .string()
    .transform((v) => v.split(','))
    .optional(),
  description: 'Restrict notifications to specific applications and add-ons',
  placeholder: 'service-id',
});

export const colorOption = defineOption({
  name: 'color',
  schema: z.boolean().default(true),
  description: 'Choose whether to print colors or not. You can also use --no-color',
});

export const updateNotifierOption = defineOption({
  name: 'update-notifier',
  schema: z.boolean().default(true),
  description: 'Choose whether to use update notifier or not. You can also use --no-update-notifier',
});

export const verboseOption = defineOption({
  name: 'verbose',
  schema: z.boolean().default(false),
  description: 'Verbose output',
  aliases: ['v'],
});
