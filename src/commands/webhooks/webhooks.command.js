import { getWebhooks } from '@clevercloud/client/esm/api/v2/notification.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { getOwnerAndApp } from '../../models/notification.js';
import { sendToApi } from '../../models/send-to-api.js';
import { humanJsonOutputFormatOption, listAllNotificationsOption, orgaIdOrNameOption } from '../global.options.js';

export const webhooksCommand = defineCommand({
  description: 'Manage webhooks',
  since: '0.6.0',
  options: {
    org: orgaIdOrNameOption,
    listAll: listAllNotificationsOption,
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const { org, listAll, format } = options;

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
  },
});
