import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as CleverJson from '../../models/clever-json.js';
import { aliasArg } from '../global.args.js';

export const makeDefaultCommand = defineCommand({
  description: 'Make a linked application the default one',
  since: '0.5.0',
  options: {},
  args: [aliasArg],
  async handler(_options, alias) {
    await CleverJson.setDefault(alias);

    Logger.printSuccess(`The application ${styleText('green', alias)} has been set as default`);
  },
});
