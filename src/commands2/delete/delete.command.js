import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as AppConfig from '../../models/app_configuration.js';
import * as Application from '../../models/application.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';

export const deleteCommand = defineCommand({
  description: 'Delete an application',
  since: '0.7.0',
  options: {
    yes: defineOption({
      name: 'yes',
      schema: z.boolean().default(false),
      description: 'Skip confirmation and delete the application directly',
      aliases: ['y'],
    }),
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [],
  async handler(options) {
    const { alias, app: appIdOrName, yes: skipConfirmation } = options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    const app = await Application.get(ownerId, appId);
    if (app == null) {
      throw new Error("The application doesn't exist");
    }

    // delete app
    await Application.deleteApp(app, skipConfirmation);
    Logger.printSuccess(`Application ${styleText('green', styleText('bold', `${app.name}`))} successfully deleted!`);
    Logger.println(`  ${styleText('grey', '•')} Application ID: ${styleText('grey', app.id)}`);

    const wasUnlinked = await AppConfig.removeLinkedApplication({ appId, alias });
    if (wasUnlinked) {
      Logger.println(`  ${styleText('blue', '→')} Local alias ${styleText('blue', alias || app.name)} unlinked`);
    }
  },
});
