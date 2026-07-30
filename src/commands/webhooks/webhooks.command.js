import { ListWebhookNotificationCommand } from '@clevercloud/client/cc-api-commands/notification/list-webhook-notification-command.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { clients } from '../../models/cc-api-client.js';
import { getOwnerAndApp } from '../../models/notification.js';
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

    const { ownerId, appId } = await getOwnerAndApp(org, org == null && !listAll);
    const hooks = await clients.ccApi.send(new ListWebhookNotificationCommand({ ownerId }));

    const formattedHooks = hooks
      .filter((hook) => {
        return appId == null || hook.scopes == null || hook.scopes.length === 0 || hook.scopes.includes(appId);
      })
      .map((hook) => ({
        id: hook.id,
        name: hook.name,
        ownerId: hook.ownerId,
        services: hook.scopes ?? [hook.ownerId],
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
