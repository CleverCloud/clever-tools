import { sourceableEnvVarsListOpt } from './env.opts.js';
import { colorOpt, updateNotifierOpt, verboseOpt, aliasOpt, appIdOrNameOpt } from '../global.opts.js';
import { commaSeparated as commaSeparatedParser } from '../../parsers.js';
import {
  getAllEnvVars,
  getAllEnvVarsForAddons,
  getAllEnvVarsForDependencies,
  removeEnvVar,
  updateAllEnvVars,
  updateEnvVar,
} from '@clevercloud/client/esm/api/v2/application.js';
import { toNameEqualsValueString, validateName } from '@clevercloud/client/esm/utils/env-vars.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import * as variables from '../../models/variables.js';

export const envImportVarsCommand = {
  name: 'import-vars',
  description: 'Add or update environment variables named <variable-names> (comma-separated), taking their values from the current environment',
  experimental: false,
  featureFlag: null,
  opts: {
    'add-export': sourceableEnvVarsListOpt,
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    alias: aliasOpt,
    app: appIdOrNameOpt
  },
  args: [
    {
      name: 'variable-names',
      description: 'Comma separated list of names of the environment variables',
      parser: commaSeparatedParser,
      complete: null
    },
  ],
  async execute(params) {
    const [envNames] = params.args;
      const { alias, app: appIdOrName } = params.options;
    
      for (const envName of envNames) {
        const nameIsValid = validateName(envName);
        if (!nameIsValid) {
          throw new Error(`Environment variable name ${envName} is invalid`);
        }
      }
    
      const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
    
      for (const envName of envNames) {
        const value = process.env[envName] || '';
        await updateEnvVar({ id: ownerId, appId, envName }, { value }).then(sendToApi);
      }
    
      Logger.println('Your environment variables have been successfully saved');
  }
};
