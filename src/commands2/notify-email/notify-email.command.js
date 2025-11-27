import { getEmailhooks } from '@clevercloud/client/esm/api/v2/notification.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { getOwnerAndApp } from '../../models/notification.js';
import { sendToApi } from '../../models/send-to-api.js';
import { humanJsonOutputFormatFlag, listAllNotificationsFlag, orgaIdOrNameFlag } from '../global.flags.js';

export const notifyEmailCommand = defineCommand({
  description: 'Manage email notifications',
  flags: {
    org: orgaIdOrNameFlag,
    'list-all': listAllNotificationsFlag,
    format: humanJsonOutputFormatFlag,
  },
  args: [],
  async handler(flags) {
    const { org, 'list-all': listAll, format } = flags;

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
  },
});
