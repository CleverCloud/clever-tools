import { CreateEmailNotificationCommand } from '@clevercloud/client/cc-api-commands/notification/create-email-notification-command.js';
import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { Logger } from '../../logger.js';
import { clients } from '../../models/cc-api-client.js';
import { getOwnerAndApp } from '../../models/notification.js';
import { notificationNameArg } from '../global.args.js';
import { notificationEventTypeOption, notificationScopeOption, orgaIdOrNameOption } from '../global.options.js';

/**
 * @param {Array<string>|null} notifTargets
 * @returns {Array<import('@clevercloud/client/cc-api-commands/notification/notification.types.js').EmailNotificationTarget>}
 */
function getEmailNotificationTargets(notifTargets) {
  if (notifTargets == null) {
    return [];
  }

  return notifTargets
    .map((el) => {
      if (el.includes('@')) {
        return { type: 'email', emailAddress: el };
      }
      if (el.startsWith('user_')) {
        return { type: 'user', userId: el };
      }
      if (el.toLowerCase() === 'organisation') {
        return { type: 'organisation' };
      }
      return null;
    })
    .filter((e) => e != null);
}

export const notifyEmailAddCommand = defineCommand({
  description: 'Add a new email notification',
  since: '0.6.1',
  options: {
    notify: defineOption({
      name: 'notify',
      schema: z.string().transform((v) => v.split(',')),
      description:
        'Notify a user, a specific email address or the whole organisation (multiple values allowed, comma separated)',
      placeholder: 'email-address|user-id|organisation',
    }),
    org: orgaIdOrNameOption,
    event: notificationEventTypeOption,
    service: notificationScopeOption,
  },
  args: [notificationNameArg],
  async handler(options, name) {
    const { org, event: events, service, notify: notifTargets } = options;

    if (service != null && org == null) {
      throw new Error('--org is required when using --service');
    }

    const { ownerId, appId } = await getOwnerAndApp(org, org == null && service == null);

    await clients.ccApi.send(
      new CreateEmailNotificationCommand({
        ownerId,
        name,
        targets: getEmailNotificationTargets(notifTargets),
        events,
        scopes: appId != null && service == null ? [appId] : service,
      }),
    );

    Logger.println('The webhook has been added');
  },
});
