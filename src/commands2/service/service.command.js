import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Addon from '../../models/addon.js';
import * as Application from '../../models/application.js';
import { aliasOption, appIdOrNameOption, humanJsonOutputFormatOption } from '../global.options.js';
import { onlyAddonsOption, onlyAppsOption, showAllOption } from './service.options.js';

export const serviceCommand = defineCommand({
  description: 'Manage service dependencies',
  since: '0.5.0',
  options: {
    'only-apps': onlyAppsOption,
    'only-addons': onlyAddonsOption,
    'show-all': showAllOption,
    alias: aliasOption,
    app: appIdOrNameOption,
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const {
      alias,
      app: appIdOrName,
      'show-all': showAll,
      'only-apps': onlyApps,
      'only-addons': onlyAddons,
      format,
    } = options;
    if (onlyApps && onlyAddons) {
      throw new Error('--only-apps and --only-addons are mutually exclusive');
    }

    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    const formattedServices = {};

    if (!onlyAddons) {
      const apps = await Application.listDependencies(ownerId, appId, showAll);
      formattedServices.applications = apps.map((app) => ({
        id: app.id,
        name: app.name,
        isLinked: app.isLinked,
      }));
    }

    if (!onlyApps) {
      const addons = await Addon.list(ownerId, appId, showAll);
      formattedServices.addons = addons.map((addon) => ({
        id: addon.id,
        realId: addon.realId,
        name: addon.name,
        isLinked: addon.isLinked,
      }));
    }

    switch (format) {
      case 'json': {
        Logger.printJson(formattedServices);
        break;
      }
      case 'human':
      default: {
        const { applications = [], addons = [] } = formattedServices;

        if (applications.length === 0 && addons.length === 0) {
          Logger.printInfo(
            `No linked services found, use ${styleText('blue', 'clever service link-app')} or ${styleText('blue', 'clever service link-addon')} to link services to an application`,
          );
          return;
        }

        if (applications.length > 0) {
          Logger.println('Applications:');
          applications.forEach(({ isLinked, name }) => Logger.println(`${isLinked ? '*' : ' '} ${name}`));
        }

        if (addons.length > 0) {
          Logger.println('Addons:');
          addons.forEach(({ isLinked, name, realId }) => Logger.println(`${isLinked ? '*' : ' '} ${name} (${realId})`));
        }
      }
    }
  },
});
