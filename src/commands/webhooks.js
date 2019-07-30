'use strict';

const colors = require('colors/safe');

const Logger = require('../logger.js');
const { getOwnerAndApp, getOrgaIdOrUserId } = require('../models/notification.js');

const { getWebhooks, createWebhook, deleteWebhook } = require('@clevercloud/client/cjs/api/notification.js');
const { sendToApi } = require('../models/send-to-api.js');

function displayWebhook (hook) {
  Logger.println((hook.name && colors.bold(hook.name)) || hook.id);
  Logger.println(`  id: ${hook.id}`);
  Logger.println(`  services: ${(hook.scope && hook.scope.join(', ')) || hook.ownerId}`);
  Logger.println(`  events: ${(hook.events && hook.events.join(', ')) || colors.bold('ALL')}`);
  Logger.println('  hooks:');
  hook.urls.forEach((url) => Logger.println(`    ${url.url} (${url.format})`));
  Logger.println();
}

async function list (params) {
  const { org, 'list-all': listAll } = params.options;

  // TODO: fix alias option
  const { ownerId, appId } = await getOwnerAndApp(null, org, !listAll);
  const hooks = await getWebhooks({ ownerId }).then(sendToApi);

  hooks
    .filter((hook) => {
      const emptyScope = !hook.scope || hook.scope.length === 0;
      return !appId || emptyScope || hook.scope.includes(appId);
    })
    .forEach((hook) => displayWebhook(hook));
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
