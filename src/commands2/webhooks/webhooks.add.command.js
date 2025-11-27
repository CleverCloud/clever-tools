import { createWebhook } from '@clevercloud/client/esm/api/v2/notification.js';
import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
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

export const webhooksAddCommand = defineCommand({
  description: 'Register webhook to be called when events happen',
  flags: {
    format: defineFlag({
      name: 'format',
      schema: z.string().default('raw'),
      description: "Format of the body sent to the webhook ('raw', 'slack', 'gitter', or 'flowdock')",
      placeholder: 'format',
    }),
    org: orgaIdOrNameFlag,
    'list-all': listAllNotificationsFlag,
    event: notificationEventTypeFlag,
    service: notificationScopeFlag,
  },
  args: [
    defineArgument({
      schema: z.string(),
      description: 'Webhook URL',
      placeholder: 'url',
    }),
    notificationNameArg,
  ],
  async handler(flags, name, hookUrl) {
    const { org, format, event: events, service } = flags;

    // TODO: fix alias option
    const { ownerId, appId } = await getOwnerAndApp(null, org, !org && !service);

    const body = {
      name,
      urls: [{ format, url: hookUrl }],
      scope: appId != null && service == null ? [appId] : service,
      events,
    };

    await createWebhook({ ownerId }, body).then(sendToApi);

    Logger.println('The webhook has been added');
  },
});
