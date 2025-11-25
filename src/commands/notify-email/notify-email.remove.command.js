import { deleteEmailhook } from '@clevercloud/client/esm/api/v2/notification.js';
import { Logger } from '../../logger.js';
import { getOrgaIdOrUserId } from '../../models/notification.js';
import { sendToApi } from '../../models/send-to-api.js';
import { notificationIdArg } from '../global.args.js';
import { colorOpt, listAllNotificationsOpt, orgaIdOrNameOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const notifyEmailRemoveCommand = {
  name: 'remove',
  description: 'Remove an existing email notification',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    org: orgaIdOrNameOpt,
    'list-all': listAllNotificationsOpt,
  },
  args: [notificationIdArg],
  async execute(params) {
    const { org } = params.options;
    const [notificationId] = params.args;

    const ownerId = await getOrgaIdOrUserId(org);
    await deleteEmailhook({ ownerId, id: notificationId }).then(sendToApi);

    Logger.println('The notification has been successfully removed');
  },
};
