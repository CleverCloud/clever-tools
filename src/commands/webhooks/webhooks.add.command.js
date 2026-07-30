import { CreateWebhookNotificationCommand } from '@clevercloud/client/cc-api-commands/notification/create-webhook-notification-command.js';
import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { Logger } from '../../logger.js';
import { clients } from '../../models/cc-api-client.js';
import { getOwnerAndApp } from '../../models/notification.js';
import { notificationNameArg } from '../global.args.js';
import { notificationEventTypeOption, notificationScopeOption, orgaIdOrNameOption } from '../global.options.js';

export const webhooksAddCommand = defineCommand({
  description: 'Register webhook to be called when events happen',
  since: '0.6.0',
  options: {
    format: defineOption({
      name: 'format',
      schema: z.string().default('raw'),
      description: "Format of the body sent to the webhook ('raw', 'slack', 'gitter', or 'flowdock')",
      placeholder: 'format',
    }),
    org: orgaIdOrNameOption,
    event: notificationEventTypeOption,
    service: notificationScopeOption,
  },
  args: [
    notificationNameArg,
    defineArgument({
      schema: z.string(),
      description: 'Webhook URL',
      placeholder: 'url',
    }),
  ],
  async handler(options, name, hookUrl) {
    const { org, format, event: events, service } = options;

    if (service != null && org == null) {
      throw new Error('--org is required when using --service');
    }

    const { ownerId, appId } = await getOwnerAndApp(org, org == null && service == null);

    await clients.ccApi.send(
      new CreateWebhookNotificationCommand({
        ownerId,
        name,
        urls: [{ format, url: hookUrl }],
        scopes: appId != null && service == null ? [appId] : service,
        events,
      }),
    );

    Logger.println('The webhook has been added');
  },
});
