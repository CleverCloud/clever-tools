import { UpdateEnvironmentCommand } from '@clevercloud/client/cc-api-commands/environment/update-environment-command.js';
import { toArray } from '@clevercloud/client/utils/environment-utils.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { clients } from '../../models/cc-api-client.js';
import * as variables from '../../models/variables.js';
import { aliasOption, appIdOrNameOption, importAsJsonOption } from '../global.options.js';

export const envImportCommand = defineCommand({
  description:
    'Load environment variables from STDIN\n(WARNING: this deletes all current variables and replace them with the new list loaded from STDIN)',
  since: '0.3.0',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
    json: importAsJsonOption,
  },
  args: [],
  async handler(options) {
    const { alias, app: appIdOrName, json } = options;
    const format = json ? 'json' : 'name-equals-value';
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    const envVars = await variables.readVariablesFromStdin(format);
    await clients.ccApi.send(
      new UpdateEnvironmentCommand({ ownerId, applicationId: appId, environment: toArray(envVars) }),
    );

    Logger.println('Environment variables have been set');
  },
});
