import { getAllExposedEnvVars } from '@clevercloud/client/esm/api/v2/application.js';
import { toNameEqualsValueString } from '@clevercloud/client/esm/utils/env-vars.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasOption, appIdOrNameOption, envFormatOption } from '../global.options.js';

export const publishedConfigCommand = defineCommand({
  description: 'Manage the configuration made available to other applications by this application',
  since: '0.5.0',
  sinceDate: '2016-06-24',
  options: {
    alias: aliasOption,
    app: appIdOrNameOption,
    format: envFormatOption,
  },
  args: [],
  async handler(options) {
    const { alias, app: appIdOrName, format } = options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    const publishedConfigs = await getAllExposedEnvVars({ id: ownerId, appId }).then(sendToApi);
    const pairs = Object.entries(publishedConfigs).map(([name, value]) => ({ name, value }));

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
