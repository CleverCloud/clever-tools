import { ListEmailNotificationCommand } from '@clevercloud/client/cc-api-commands/notification/list-email-notification-command.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { clients } from '../../models/cc-api-client.js';
import { getOwnerAndApp } from '../../models/notification.js';
import { humanJsonOutputFormatOption, listAllNotificationsOption, orgaIdOrNameOption } from '../global.options.js';

/**
 * @param {import('@clevercloud/client/cc-api-commands/notification/notification.types.js').EmailNotificationTarget} target
 * @returns {string}
 */
function formatTarget(target) {
  switch (target.type) {
    case 'email':
      return target.emailAddress;
    case 'user':
      return target.userId;
    case 'organisation':
    default:
      return 'whole team';
  }
}

export const notifyEmailCommand = defineCommand({
  description: 'Manage email notifications',
  since: '0.6.1',
  options: {
    org: orgaIdOrNameOption,
    listAll: listAllNotificationsOption,
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const { org, listAll, format } = options;

    const { ownerId, appId } = await getOwnerAndApp(org, org == null && !listAll);
    const hooks = await clients.ccApi.send(new ListEmailNotificationCommand({ ownerId }));

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
        notified: hook.targets != null ? hook.targets.map(formatTarget) : ['whole team'],
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
  },
});
