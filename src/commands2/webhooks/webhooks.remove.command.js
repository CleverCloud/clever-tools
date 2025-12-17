import { deleteWebhook } from '@clevercloud/client/esm/api/v2/notification.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { getOrgaIdOrUserId } from '../../models/notification.js';
import { sendToApi } from '../../models/send-to-api.js';
import { notificationIdArg } from '../global.args.js';
import { listAllNotificationsOption, orgaIdOrNameOption } from '../global.options.js';

export const webhooksRemoveCommand = defineCommand({
  description: 'Remove an existing webhook',
  since: '0.6.0',
  options: {
    org: orgaIdOrNameOption,
    'list-all': listAllNotificationsOption,
  },
  args: [notificationIdArg],
  async handler(options, notificationId) {
    const { org } = options;

    const ownerId = await getOrgaIdOrUserId(org);
    await deleteWebhook({ ownerId, id: notificationId }).then(sendToApi);

    Logger.println('The notification has been successfully removed');
  },
});
