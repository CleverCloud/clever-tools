import { deleteWebhook } from '@clevercloud/client/esm/api/v2/notification.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { getOrgaIdOrUserId } from '../../models/notification.js';
import { sendToApi } from '../../models/send-to-api.js';
import { notificationIdArg } from '../global.args.js';
import { listAllNotificationsFlag, orgaIdOrNameFlag } from '../global.flags.js';

export const webhooksRemoveCommand = defineCommand({
  description: 'Remove an existing webhook',
  flags: {
    org: orgaIdOrNameFlag,
    'list-all': listAllNotificationsFlag,
  },
  args: [notificationIdArg],
  async handler(flags, notificationId) {
    const { org } = flags;

    const ownerId = await getOrgaIdOrUserId(org);
    await deleteWebhook({ ownerId, id: notificationId }).then(sendToApi);

    Logger.println('The notification has been successfully removed');
  },
});
