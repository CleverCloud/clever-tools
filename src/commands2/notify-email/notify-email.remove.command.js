import { deleteEmailhook } from '@clevercloud/client/esm/api/v2/notification.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { getOrgaIdOrUserId } from '../../models/notification.js';
import { sendToApi } from '../../models/send-to-api.js';
import { notificationIdArg } from '../global.args.js';
import { listAllNotificationsOption, orgaIdOrNameOption } from '../global.options.js';

export const notifyEmailRemoveCommand = defineCommand({
  description: 'Remove an existing email notification',
  since: '0.6.1',
  sinceDate: '2016-10-24',
  options: {
    org: orgaIdOrNameOption,
    'list-all': listAllNotificationsOption,
  },
  args: [notificationIdArg],
  async handler(options, notificationId) {
    const { org } = options;

    const ownerId = await getOrgaIdOrUserId(org);
    await deleteEmailhook({ ownerId, id: notificationId }).then(sendToApi);

    Logger.println('The notification has been successfully removed');
  },
});
