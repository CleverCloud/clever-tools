import { z } from 'zod';
import { defineFlag } from '../lib/define-flag.js';
import { listAvailableAliases } from '../models/application.js';
import { listMetaEvents } from '../models/notification.js';
import { appIdOrName, date, orgaIdOrName } from '../parsers.js';

export const aliasFlag = defineFlag({
  name: 'alias',
  schema: z.string().optional(),
  description: 'Short name for the application',
  aliases: ['a'],
  placeholder: 'alias',
  complete: listAvailableAliases,
});

export const appIdOrNameFlag = defineFlag({
  name: 'app',
  schema: z.string().transform(appIdOrName).optional(),
  description: 'Application to manage by its ID (or name, if unambiguous)',
  placeholder: 'ID_OR_NAME',
});

export const logsFormatFlag = defineFlag({
  name: 'format',
  schema: z.string().default('human'),
  description: 'Output format (${...})',
  aliases: ['F'],
  placeholder: 'format',
});

export const beforeFlag = defineFlag({
  name: 'before',
  schema: z.string().transform(date).optional(),
  description: 'Fetch logs before this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h)',
  aliases: ['until'],
  placeholder: 'before',
});

export const afterFlag = defineFlag({
  name: 'after',
  schema: z.string().transform(date).optional(),
  description: 'Fetch logs after this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h)',
  aliases: ['since'],
  placeholder: 'after',
});

export const addonIdFlag = defineFlag({
  name: 'addon',
  schema: z.string().optional(),
  description: 'Add-on ID',
  placeholder: 'addon_id',
});

export const orgaIdOrNameFlag = defineFlag({
  name: 'org',
  schema: z.string().transform(orgaIdOrName).optional(),
  description: 'Organisation to target by its ID (or name, if unambiguous)',
  aliases: ['o', 'owner'],
  placeholder: 'ID_OR_NAME',
});

export const humanJsonOutputFormatFlag = defineFlag({
  name: 'format',
  schema: z.string().default('human'),
  description: 'Output format (${...})',
  aliases: ['F'],
  placeholder: 'format',
});

export const confirmAddonDeletionFlag = defineFlag({
  name: 'yes',
  schema: z.boolean().default(false),
  description: 'Skip confirmation and delete the add-on directly',
  aliases: ['y'],
});

export const envFormatFlag = defineFlag({
  name: 'format',
  schema: z.string().default('human'),
  description: 'Output format (${...})',
  aliases: ['F'],
  placeholder: 'format',
});

export const aliasCreationFlag = defineFlag({
  name: 'alias',
  schema: z.string().optional(),
  description: 'Short name for the application',
  aliases: ['a'],
  placeholder: 'alias',
});

export const quietFlag = defineFlag({
  name: 'quiet',
  schema: z.boolean().default(false),
  description: "Don't show logs during deployment",
  aliases: ['q'],
});

export const followDeployLogsFlag = defineFlag({
  name: 'follow',
  schema: z.boolean().default(false),
  description: 'Continue to follow logs after deployment has ended',
});

export const exitOnDeployFlag = defineFlag({
  name: 'exit-on',
  schema: z.string().default('deploy-end'),
  description: 'Step at which the logs streaming is ended, steps are: ${...}',
  aliases: ['e'],
  placeholder: 'step',
});

export const importAsJsonFlag = defineFlag({
  name: 'json',
  schema: z.boolean().default(false),
  description: 'Import variables as JSON (an array of { \"name\": \"THE_NAME\", \"value\": \"THE_VALUE\" } objects)',
});

export const targetVersionFlag = defineFlag({
  name: 'target',
  schema: z.string().optional(),
  description: 'Target version to upgrade to (e.g.: 24, 2.4, 2.4.1)',
  placeholder: 'version',
});

export const listAllNotificationsFlag = defineFlag({
  name: 'list-all',
  schema: z.boolean().default(false),
  description: "List all notifications for your user or for an organisation with the '--org' option",
});

export const notificationEventTypeFlag = defineFlag({
  name: 'event',
  schema: z
    .string()
    .transform((v) => v.split(','))
    .optional(),
  description: 'Restrict notifications to specific event types',
  placeholder: 'type',
  complete: listMetaEvents,
});

export const notificationScopeFlag = defineFlag({
  name: 'service',
  schema: z
    .string()
    .transform((v) => v.split(','))
    .optional(),
  description: 'Restrict notifications to specific applications and add-ons',
  placeholder: 'service_id',
});

export const colorFlag = defineFlag({
  name: 'color',
  schema: z.boolean().default(true),
  description: 'Choose whether to print colors or not. You can also use --no-color',
});

export const updateNotifierFlag = defineFlag({
  name: 'update-notifier',
  schema: z.boolean().default(true),
  description: 'Choose whether to use update notifier or not. You can also use --no-update-notifier',
});

export const verboseFlag = defineFlag({
  name: 'verbose',
  schema: z.boolean().default(false),
  description: 'Verbose output',
  aliases: ['v'],
});
