import { notificationNameArg } from '../global.args.js';
import { colorOpt, updateNotifierOpt, verboseOpt, orgaIdOrNameOpt, listAllNotificationsOpt, notificationEventTypeOpt, notificationScopeOpt } from '../global.opts.js';
import { createWebhook, deleteWebhook, getWebhooks } from '@clevercloud/client/esm/api/v2/notification.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { getOrgaIdOrUserId, getOwnerAndApp } from '../../models/notification.js';
import { sendToApi } from '../../models/send-to-api.js';

export const webhooksAddCommand = {
  name: 'add',
  description: 'Register webhook to be called when events happen',
  experimental: false,
  featureFlag: null,
  opts: {
    format: {
      name: 'format',
      description: 'Format of the body sent to the webhook (\'raw\', \'slack\', \'gitter\', or \'flowdock\')',
      type: 'option',
      metavar: 'format',
      aliases: null,
      default: 'raw',
      required: null,
      parser: null,
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
    {
      name: 'url',
      description: 'Webhook URL',
      parser: null,
      complete: null
    },
    notificationNameArg,
  ],
  async execute(params) {
    const { org, format, event: events, service } = params.options;
      const [name, hookUrl] = params.args;
    
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
  }
};
