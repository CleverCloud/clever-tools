import { listAvailableAliases } from '../models/application.js';
import { listMetaEvents } from '../models/notification.js';
import {
  appIdOrName as appIdOrNameParser,
  commaSeparated as commaSeparatedParser,
  date as dateParser,
  orgaIdOrName as orgaIdOrNameParser,
} from '../parsers.js';

export const colorOpt = {
  name: 'color',
  description: 'Choose whether to print colors or not. You can also use --no-color',
  type: 'flag',
  metavar: null,
  aliases: null,
  default: true,
  required: null,
  parser: null,
  complete: null,
};

export const updateNotifierOpt = {
  name: 'update-notifier',
  description: 'Choose whether to use update notifier or not. You can also use --no-update-notifier',
  type: 'flag',
  metavar: null,
  aliases: null,
  default: true,
  required: null,
  parser: null,
  complete: null,
};

export const verboseOpt = {
  name: 'verbose',
  description: 'Verbose output',
  type: 'flag',
  metavar: null,
  aliases: ['v'],
  default: null,
  required: null,
  parser: null,
  complete: null,
};

export const aliasOpt = {
  name: 'alias',
  description: 'Short name for the application',
  type: 'option',
  metavar: 'alias',
  aliases: ['a'],
  default: null,
  required: null,
  parser: null,
  complete: listAvailableAliases,
};

export const appIdOrNameOpt = {
  name: 'app',
  description: 'Application to manage by its ID (or name, if unambiguous)',
  type: 'option',
  metavar: 'ID_OR_NAME',
  aliases: null,
  default: null,
  required: null,
  parser: appIdOrNameParser,
  complete: null,
};

export const logsFormatOpt = {
  name: 'format',
  description: 'Output format (${...})',
  type: 'option',
  metavar: 'format',
  aliases: ['F'],
  default: 'human',
  required: null,
  parser: null,
  complete: null,
};

export const beforeOpt = {
  name: 'before',
  description: 'Fetch logs before this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h)',
  type: 'option',
  metavar: 'before',
  aliases: ['until'],
  default: null,
  required: null,
  parser: dateParser,
  complete: null,
};

export const afterOpt = {
  name: 'after',
  description: 'Fetch logs after this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h)',
  type: 'option',
  metavar: 'after',
  aliases: ['since'],
  default: null,
  required: null,
  parser: dateParser,
  complete: null,
};

export const addonIdOpt = {
  name: 'addon',
  description: 'Add-on ID',
  type: 'option',
  metavar: 'addon_id',
  aliases: null,
  default: null,
  required: null,
  parser: null,
  complete: null,
};

export const orgaIdOrNameOpt = {
  name: 'org',
  description: 'Organisation to target by its ID (or name, if unambiguous)',
  type: 'option',
  metavar: 'ID_OR_NAME',
  aliases: ['o', 'owner'],
  default: null,
  required: null,
  parser: orgaIdOrNameParser,
  complete: null,
};

export const humanJsonOutputFormatOpt = {
  name: 'format',
  description: 'Output format (${...})',
  type: 'option',
  metavar: 'format',
  aliases: ['F'],
  default: 'human',
  required: null,
  parser: null,
  complete: null,
};

export const confirmAddonDeletionOpt = {
  name: 'yes',
  description: 'Skip confirmation and delete the add-on directly',
  type: 'flag',
  metavar: null,
  aliases: ['y'],
  default: null,
  required: null,
  parser: null,
  complete: null,
};

export const envFormatOpt = {
  name: 'format',
  description: 'Output format (${...})',
  type: 'option',
  metavar: 'format',
  aliases: ['F'],
  default: 'human',
  required: null,
  parser: null,
  complete: null,
};

export const aliasCreationOpt = {
  name: 'alias',
  description: 'Short name for the application',
  type: 'option',
  metavar: 'alias',
  aliases: ['a'],
  default: null,
  required: null,
  parser: null,
  complete: null,
};

export const quietOpt = {
  name: 'quiet',
  description: "Don't show logs during deployment",
  type: 'flag',
  metavar: null,
  aliases: ['q'],
  default: null,
  required: null,
  parser: null,
  complete: null,
};

export const followDeployLogsOpt = {
  name: 'follow',
  description: 'Continue to follow logs after deployment has ended',
  type: 'flag',
  metavar: null,
  aliases: null,
  default: null,
  required: null,
  parser: null,
  complete: null,
};

export const exitOnDeployOpt = {
  name: 'exit-on',
  description: 'Step at which the logs streaming is ended, steps are: ${...}',
  type: 'option',
  metavar: 'step',
  aliases: ['e'],
  default: 'deploy-end',
  required: null,
  parser: null,
  complete: null,
};

export const importAsJsonOpt = {
  name: 'json',
  description: 'Import variables as JSON (an array of { \"name\": \"THE_NAME\", \"value\": \"THE_VALUE\" } objects)',
  type: 'flag',
  metavar: null,
  aliases: null,
  default: null,
  required: null,
  parser: null,
  complete: null,
};

export const targetVersionOpt = {
  name: 'target',
  description: 'Target version to upgrade to (e.g.: 24, 2.4, 2.4.1)',
  type: 'option',
  metavar: 'version',
  aliases: null,
  default: null,
  required: null,
  parser: null,
  complete: null,
};

export const listAllNotificationsOpt = {
  name: 'list-all',
  description: "List all notifications for your user or for an organisation with the '--org' option",
  type: 'flag',
  metavar: null,
  aliases: null,
  default: null,
  required: null,
  parser: null,
  complete: null,
};

export const notificationEventTypeOpt = {
  name: 'event',
  description: 'Restrict notifications to specific event types',
  type: 'option',
  metavar: 'type',
  aliases: null,
  default: null,
  required: null,
  parser: commaSeparatedParser,
  complete: listMetaEvents,
};

export const notificationScopeOpt = {
  name: 'service',
  description: 'Restrict notifications to specific applications and add-ons',
  type: 'option',
  metavar: 'service_id',
  aliases: null,
  default: null,
  required: null,
  parser: commaSeparatedParser,
  complete: null,
};
