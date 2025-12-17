import { createEmailhook } from '@clevercloud/client/esm/api/v2/notification.js';
import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { Logger } from '../../logger.js';
import { getOwnerAndApp } from '../../models/notification.js';
import { sendToApi } from '../../models/send-to-api.js';
import { notificationNameArg } from '../global.args.js';
import {
  listAllNotificationsOption,
  notificationEventTypeOption,
  notificationScopeOption,
  orgaIdOrNameOption,
} from '../global.options.js';

function getEmailNotificationTargets(notifTargets) {
  if (notifTargets == null) {
    return [];
  }

  return notifTargets
    .map((el) => {
      if (el.includes('@')) {
        return { type: 'email', target: el };
      }
      if (el.startsWith('user_')) {
        return { type: 'userid', target: el };
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
    'list-all': listAllNotificationsOption,
    event: notificationEventTypeOption,
    service: notificationScopeOption,
  },
  args: [notificationNameArg],
  async handler(options, name) {
    const { org, event: events, service, notify: notifTargets } = options;

    // TODO: fix alias option
    const { ownerId, appId } = await getOwnerAndApp(null, org, !org && !service);

    const body = {
      name,
      notified: getEmailNotificationTargets(notifTargets),
      scope: appId != null && service == null ? [appId] : service,
      events,
    };

    await createEmailhook({ ownerId }, body).then(sendToApi);

    Logger.println('The webhook has been added');
  },
});
