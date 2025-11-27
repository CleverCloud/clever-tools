import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as AppConfig from '../../models/app_configuration.js';
import { aliasArg } from '../global.args.js';

export const makeDefaultCommand = defineCommand({
  description: 'Make a linked application the default one',
  flags: {},
  args: [aliasArg],
  async handler(_flags, alias) {
    await AppConfig.setDefault(alias);

    Logger.printSuccess(`The application ${styleText('green', alias)} has been set as default`);
  },
});
