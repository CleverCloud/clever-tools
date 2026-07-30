import { DeleteWebhookNotificationCommand } from '@clevercloud/client/cc-api-commands/notification/delete-webhook-notification-command.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { clients } from '../../models/cc-api-client.js';
import { getOwnerIdFromOrgIdOrName } from '../../models/ids-resolver.js';
import { notificationIdArg } from '../global.args.js';
import { orgaIdOrNameOption } from '../global.options.js';

export const webhooksRemoveCommand = defineCommand({
  description: 'Remove an existing webhook',
  since: '0.6.0',
  options: {
    org: orgaIdOrNameOption,
  },
  args: [notificationIdArg],
  async handler(options, notificationId) {
    const { org } = options;

    const ownerId = await getOwnerIdFromOrgIdOrName(org);
    await clients.ccApi.send(new DeleteWebhookNotificationCommand({ ownerId, webhookNotificationId: notificationId }));

    Logger.println('The notification has been successfully removed');
  },
});
