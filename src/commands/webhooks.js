'use strict';

const colors = require('colors/safe.js');

const Logger = require('../logger.js');
const { getOwnerAndApp, getOrgaIdOrUserId } = require('../models/notification.js');

const { getWebhooks, createWebhook, deleteWebhook } = require('@clevercloud/client/cjs/api/v2/notification.js');
const { sendToApi } = require('../models/send-to-api.js');

async function list (params) {
  const { org, 'list-all': listAll, format } = params.options;

  // TODO: fix alias option
  const { ownerId, appId } = await getOwnerAndApp(null, org, !listAll);
  const hooks = await getWebhooks({ ownerId }).then(sendToApi);

  const formattedHooks = hooks
    .filter((hook) => {
      const emptyScope = !hook.scope || hook.scope.length === 0;
      return !appId || emptyScope || hook.scope.includes(appId);
    })
    .map((hook) => ({
      id: hook.id,
      name: hook.name,
      ownerId: hook.ownerId,
      services: hook.scope ?? [hook.ownerId],
      events: hook.events ?? ['ALL'],
      urls: hook.urls,
    }));

  switch (format) {
    case 'json': {
      Logger.printJson(formattedHooks);
      break;
    }
    case 'human':
    default: {
      formattedHooks.forEach((hook) => {
        Logger.println(hook.name ? colors.bold(hook.name) : hook.id);
        Logger.println(`  id: ${hook.id}`);
        Logger.println(`  services: ${hook.services.join(', ')}`);
        Logger.println(`  events: ${hook.events.join(', ')}`);
        Logger.println('  hooks:');
        hook.urls.forEach((url) => Logger.println(`    ${url.url} (${url.format})`));
      });
    }
  }
}

async function add (params) {
  const { org, format, event: events, service } = params.options;
  const [name, hookUrl] = params.args;

  // TODO: fix alias option
  const { ownerId, appId } = await getOwnerAndApp(null, org, !org && !service);

  const body = {
    name,
    urls: [{ format, url: hookUrl }],
    scope: (appId != null && service == null) ? [appId] : service,
    events,
  };

  await createWebhook({ ownerId }, body).then(sendToApi);

  Logger.println('The webhook has been added');
}

async function remove (params) {
  const { org } = params.options;
  const [notificationId] = params.args;

  const ownerId = await getOrgaIdOrUserId(org);
  await deleteWebhook({ ownerId, id: notificationId }).then(sendToApi);

  Logger.println('The notification has been successfully removed');
}

module.exports = {
  list,
  add,
  remove,
};
