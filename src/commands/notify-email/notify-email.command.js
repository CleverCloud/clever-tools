import { colorOpt, updateNotifierOpt, verboseOpt, orgaIdOrNameOpt, listAllNotificationsOpt, humanJsonOutputFormatOpt } from '../global.opts.js';
import { createEmailhook, deleteEmailhook, getEmailhooks } from '@clevercloud/client/esm/api/v2/notification.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { getOrgaIdOrUserId, getOwnerAndApp } from '../../models/notification.js';
import { sendToApi } from '../../models/send-to-api.js';

export const notifyEmailCommand = {
  name: 'notify-email',
  description: 'Manage email notifications',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    org: orgaIdOrNameOpt,
    'list-all': listAllNotificationsOpt,
    format: humanJsonOutputFormatOpt
  },
  args: [],
  async execute(params) {
    const { org, 'list-all': listAll, format } = params.options;
    
      // TODO: fix alias option
      const { ownerId, appId } = await getOwnerAndApp(null, org, !listAll);
      const hooks = await getEmailhooks({ ownerId }).then(sendToApi);
    
      const formattedHooks = hooks
        .filter((hook) => {
          const emptyScope = !hook.scope || hook.scope.length === 0;
          return !appId || emptyScope || hook.scope.includes(appId);
        })
        .map((hook) => ({
          id: hook.id,
          name: hook.name,
          ownerId: hook.ownerId,
          services: hook.scope ?? [hook.ownerId],
          events: hook.events ?? ['ALL'],
          notified: hook.notified ? hook.notified.map(({ target }) => target ?? 'whole team') : ['whole team'],
        }));
    
      switch (format) {
        case 'json': {
          Logger.printJson(formattedHooks);
          break;
        }
        case 'human':
        default: {
          formattedHooks.forEach((hook) => {
            Logger.println(styleText('bold', hook.name ?? hook.id));
            Logger.println(`  id: ${hook.id}`);
            Logger.println(`  services: ${hook.services.join(', ')}`);
            Logger.println(`  events: ${hook.events.join(', ')}`);
            if (hook.notified.length > 1) {
              Logger.println('  to:');
              hook.notified.forEach((target) => Logger.println(`    ${target}`));
            } else {
              Logger.println(`  to: ${hook.notified[0]}`);
            }
          });
        }
      }
  }
};
