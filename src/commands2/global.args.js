import { z } from 'zod';
import { defineArgument } from '../lib/define-argument.js';
import { addonIdOrName, appIdOrName } from '../parsers.js';

export const addonIdOrNameArg = defineArgument({
  schema: z.string().transform(addonIdOrName),
  description: 'Add-on ID (or name, if unambiguous)',
  placeholder: 'addon-id|addon-name',
});

export const envVariableNameArg = defineArgument({
  schema: z.string(),
  description: 'Name of the environment variable',
  placeholder: 'variable-name',
});

export const envVariableValueArg = defineArgument({
  schema: z.string(),
  description: 'Value of the environment variable',
  placeholder: 'variable-value',
});

export const appIdOrNameArg = defineArgument({
  schema: z.string().transform(appIdOrName),
  description: 'Application ID (or name, if unambiguous)',
  placeholder: 'app-id|app-name',
});

export const aliasArg = defineArgument({
  schema: z.string(),
  description: 'Application alias',
  placeholder: 'app-alias',
});

export const notificationNameArg = defineArgument({
  schema: z.string(),
  description: 'Notification name',
  placeholder: 'name',
});

export const notificationIdArg = defineArgument({
  schema: z.string(),
  description: 'Notification ID',
  placeholder: 'notification-id',
});
