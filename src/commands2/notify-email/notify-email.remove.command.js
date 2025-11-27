import { deleteEmailhook } from '@clevercloud/client/esm/api/v2/notification.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { getOrgaIdOrUserId } from '../../models/notification.js';
import { sendToApi } from '../../models/send-to-api.js';
import { notificationIdArg } from '../global.args.js';
import { listAllNotificationsFlag, orgaIdOrNameFlag } from '../global.flags.js';

export const notifyEmailRemoveCommand = defineCommand({
  description: 'Remove an existing email notification',
  flags: {
    org: orgaIdOrNameFlag,
    'list-all': listAllNotificationsFlag,
  },
  args: [notificationIdArg],
  async handler(flags, notificationId) {
    const { org } = flags;

    const ownerId = await getOrgaIdOrUserId(org);
    await deleteEmailhook({ ownerId, id: notificationId }).then(sendToApi);

    Logger.println('The notification has been successfully removed');
  },
});
