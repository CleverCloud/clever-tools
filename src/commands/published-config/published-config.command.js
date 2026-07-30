import { GetExposedEnvironmentCommand } from '@clevercloud/client/cc-api-commands/environment/get-exposed-environment-command.js';
import { toNameEqualsValueString } from '@clevercloud/client/utils/environment-utils.js';
import { tolerateNotFound } from '@clevercloud/client/utils/error-utils.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { clients } from '../../models/cc-api-client.js';
import { aliasOption, appIdOrNameOption, envFormatOption } from '../global.options.js';

export const publishedConfigCommand = defineCommand({
  description: 'Manage the configuration made available to other applications by this application',
  since: '0.5.0',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
    format: envFormatOption,
  },
  args: [],
  async handler(options) {
    const { alias, app: appIdOrName, format } = options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    // The client returns an array of { name, value } objects, sorted by name
    const pairs =
      (await tolerateNotFound(
        clients.ccApi.send(new GetExposedEnvironmentCommand({ ownerId, applicationId: appId })),
      )) ?? [];

    switch (format) {
      case 'json': {
        Logger.printJson(pairs);
        break;
      }
      case 'shell':
        Logger.println(toNameEqualsValueString(pairs, { addExports: true }));
        break;
      case 'human':
      default: {
        Logger.println('# Published configs');
        Logger.println(toNameEqualsValueString(pairs, { addExports: false }));
      }
    }
  },
});
