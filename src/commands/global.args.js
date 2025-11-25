import { addonIdOrName as addonIdOrNameParser, appIdOrName as appIdOrNameParser } from '../parsers.js';

export const addonIdOrNameArg = {
  name: 'addon-id',
  description: 'Add-on ID (or name, if unambiguous)',
  parser: addonIdOrNameParser,
  complete: null
};

export const envVariableNameArg = {
  name: 'variable-name',
  description: 'Name of the environment variable',
  parser: null,
  complete: null
};

export const envVariableValueArg = {
  name: 'variable-value',
  description: 'Value of the environment variable',
  parser: null,
  complete: null
};

export const appIdOrNameArg = {
  name: 'app-id',
  description: 'Application ID (or name, if unambiguous)',
  parser: appIdOrNameParser,
  complete: null
};

export const aliasArg = {
  name: 'app-alias',
  description: 'Application alias',
  parser: null,
  complete: null
};

export const notificationNameArg = {
  name: 'name',
  description: 'Notification name',
  parser: null,
  complete: null
};

export const notificationIdArg = {
  name: 'notification-id',
  description: 'Notification ID',
  parser: null,
  complete: null
};

