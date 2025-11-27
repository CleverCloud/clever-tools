import { createEmailhook } from '@clevercloud/client/esm/api/v2/notification.js';
import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineFlag } from '../../lib/define-flag.js';
import { Logger } from '../../logger.js';
import { getOwnerAndApp } from '../../models/notification.js';
import { sendToApi } from '../../models/send-to-api.js';
import { notificationNameArg } from '../global.args.js';
import {
  listAllNotificationsFlag,
  notificationEventTypeFlag,
  notificationScopeFlag,
  orgaIdOrNameFlag,
} from '../global.flags.js';

export const notifyEmailAddCommand = defineCommand({
  description: 'Add a new email notification',
  flags: {
    notify: defineFlag({
      name: 'notify',
      schema: z.string().transform((v) => v.split(',')),
      description:
        'Notify a user, a specific email address or the whole organisation (multiple values allowed, comma separated)',
      placeholder: '<email_address>|<user_id>|\"organisation\"',
    }),
    org: orgaIdOrNameFlag,
    'list-all': listAllNotificationsFlag,
    event: notificationEventTypeFlag,
    service: notificationScopeFlag,
  },
  args: [notificationNameArg],
  async handler(flags, name) {
    const { org, event: events, service, notify: notifTargets } = flags;

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
