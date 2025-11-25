import { colorOpt, updateNotifierOpt, verboseOpt, orgaIdOrNameOpt, listAllNotificationsOpt, humanJsonOutputFormatOpt } from '../global.opts.js';
import { createWebhook, deleteWebhook, getWebhooks } from '@clevercloud/client/esm/api/v2/notification.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { getOrgaIdOrUserId, getOwnerAndApp } from '../../models/notification.js';
import { sendToApi } from '../../models/send-to-api.js';

export const webhooksCommand = {
  name: 'webhooks',
  description: 'Manage webhooks',
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
      const hooks = await getWebhooks({ ownerId }).then(sendToApi);
    
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
          urls: hook.urls,
        }));
    
      switch (format) {
        case 'json': {
          Logger.printJson(formattedHooks);
          break;
        }
        case 'human':
        default: {
          formattedHooks.forEach((hook) => {
            Logger.println(hook.name ? styleText('bold', hook.name) : hook.id);
            Logger.println(`  id: ${hook.id}`);
            Logger.println(`  services: ${hook.services.join(', ')}`);
            Logger.println(`  events: ${hook.events.join(', ')}`);
            Logger.println('  hooks:');
            hook.urls.forEach((url) => Logger.println(`    ${url.url} (${url.format})`));
          });
        }
      }
  }
};
