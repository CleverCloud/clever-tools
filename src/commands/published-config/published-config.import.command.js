import { UpdateExposedEnvironmentCommand } from '@clevercloud/client/cc-api-commands/environment/update-exposed-environment-command.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { clients } from '../../models/cc-api-client.js';
import * as variables from '../../models/variables.js';
import { aliasOption, appIdOrNameOption, importAsJsonOption } from '../global.options.js';

export const publishedConfigImportCommand = defineCommand({
  description:
    'Load published configuration from STDIN\n(WARNING: this deletes all current variables and replace them with the new list loaded from STDIN)',
  since: '0.5.0',
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

    // readVariablesFromStdin returns { NAME: "value" } format
    // but the client expects [{ name, value }] format
    const publishedConfigs = await variables.readVariablesFromStdin(format);
    const environment = Object.entries(publishedConfigs).map(([name, value]) => ({ name, value }));

    await clients.ccApi.send(new UpdateExposedEnvironmentCommand({ ownerId, applicationId: appId, environment }));

    Logger.println('Your published configs have been set');
  },
});
