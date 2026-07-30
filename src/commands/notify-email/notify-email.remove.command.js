import { DeleteEmailNotificationCommand } from '@clevercloud/client/cc-api-commands/notification/delete-email-notification-command.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { clients } from '../../models/cc-api-client.js';
import { getOwnerIdFromOrgIdOrName } from '../../models/ids-resolver.js';
import { notificationIdArg } from '../global.args.js';
import { orgaIdOrNameOption } from '../global.options.js';

export const notifyEmailRemoveCommand = defineCommand({
  description: 'Remove an existing email notification',
  since: '0.6.1',
  options: {
    org: orgaIdOrNameOption,
  },
  args: [notificationIdArg],
  async handler(options, notificationId) {
    const { org } = options;

    const ownerId = await getOwnerIdFromOrgIdOrName(org);
    await clients.ccApi.send(new DeleteEmailNotificationCommand({ ownerId, emailNotificationId: notificationId }));

    Logger.println('The notification has been successfully removed');
  },
});
