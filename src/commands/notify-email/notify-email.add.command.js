import { notificationNameArg } from '../global.args.js';
import { colorOpt, updateNotifierOpt, verboseOpt, orgaIdOrNameOpt, listAllNotificationsOpt, notificationEventTypeOpt, notificationScopeOpt } from '../global.opts.js';
import { commaSeparated as commaSeparatedParser } from '../../parsers.js';
import { createEmailhook, deleteEmailhook, getEmailhooks } from '@clevercloud/client/esm/api/v2/notification.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { getOrgaIdOrUserId, getOwnerAndApp } from '../../models/notification.js';
import { sendToApi } from '../../models/send-to-api.js';

export const notifyEmailAddCommand = {
  name: 'add',
  description: 'Add a new email notification',
  experimental: false,
  featureFlag: null,
  opts: {
    notify: {
      name: 'notify',
      description: 'Notify a user, a specific email address or the whole organisation (multiple values allowed, comma separated)',
      type: 'option',
      metavar: '<email_address>|<user_id>|\"organisation\"',
      aliases: null,
      default: null,
      required: true,
      parser: commaSeparatedParser,
      complete: null
    },
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    org: orgaIdOrNameOpt,
    'list-all': listAllNotificationsOpt,
    event: notificationEventTypeOpt,
    service: notificationScopeOpt
  },
  args: [
    notificationNameArg,
  ],
  async execute(params) {
    const { org, event: events, service, notify: notifTargets } = params.options;
      const [name] = params.args;
    
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
  }
};
