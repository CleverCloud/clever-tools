import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import * as ApplicationConfiguration from '../../models/application_configuration.js';
import { aliasFlag, appIdOrNameFlag } from '../global.flags.js';
import { configurationNameArg } from './config.args.js';

export const configSetCommand = defineCommand({
  description: 'Edit one configuration setting',
  flags: {
    alias: aliasFlag,
    app: appIdOrNameFlag,
  },
  args: [
    defineArgument({
      schema: z.string(),
      description: 'The new value of the configuration',
      placeholder: 'configuration-value',
    }),
    configurationNameArg,
  ],
  async handler(flags, configurationName, configurationValue) {
    const { alias, app: appIdOrName } = flags;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
    const config = ApplicationConfiguration.getById(configurationName);
    const options = {
      [config.name]: ApplicationConfiguration.parse(config, configurationValue),
    };
    const app = await Application.updateOptions(ownerId, appId, options);
    Logger.printSuccess(
      `Config ${styleText('green', config.id)} successfully updated to ${styleText('green', ApplicationConfiguration.formatValue(config, app[config.name]).toString())}!`,
    );
  },
});
