import { defineArgument } from '../lib/define-argument.js';
import { addonIdOrName as addonIdOrNameParser, appIdOrName as appIdOrNameParser } from '../parsers.js';

export const addonIdOrNameArg = defineArgument({
  name: 'addon-id',
  description: 'Add-on ID (or name, if unambiguous)',
  parser: addonIdOrNameParser,
  complete: null,
});

export const envVariableNameArg = defineArgument({
  name: 'variable-name',
  description: 'Name of the environment variable',
  parser: null,
  complete: null,
});

export const envVariableValueArg = defineArgument({
  name: 'variable-value',
  description: 'Value of the environment variable',
  parser: null,
  complete: null,
});

export const appIdOrNameArg = defineArgument({
  name: 'app-id',
  description: 'Application ID (or name, if unambiguous)',
  parser: appIdOrNameParser,
  complete: null,
});

export const aliasArg = defineArgument({
  name: 'app-alias',
  description: 'Application alias',
  parser: null,
  complete: null,
});

export const notificationNameArg = defineArgument({
  name: 'name',
  description: 'Notification name',
  parser: null,
  complete: null,
});

export const notificationIdArg = defineArgument({
  name: 'notification-id',
  description: 'Notification ID',
  parser: null,
  complete: null,
});
