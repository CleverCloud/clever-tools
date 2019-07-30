'use strict';

const colors = require('colors/safe');

const handleCommandStream = require('../command-stream-handler');
const Logger = require('../logger.js');
const Notification = require('../models/notification.js');

function displayWebhook (hook) {
  Logger.println((hook.name && colors.bold(hook.name)) || hook.id);
  Logger.println(`  id: ${hook.id}`);
  Logger.println(`  services: ${(hook.scope && hook.scope.join(', ')) || hook.ownerId}`);
  Logger.println(`  events: ${(hook.events && hook.events.join(', ')) || colors.bold('ALL')}`);
  Logger.println('  hooks:');
  hook.urls.forEach((url) => Logger.println(`    ${url.url} (${url.format})`));
  Logger.println();
}

function listWebhooks (api, params) {
  const { 'list-all': listAll } = params.options;

  const s_hooks = Notification.getOwnerAndApp(api, params, !listAll)
    .flatMapLatest((ownerAndApp) => {
      return Notification.list(api, 'webhooks', ownerAndApp.ownerId, ownerAndApp.appId);
    })
    .map((hooks) => {
      hooks.forEach((hook) => {
        displayWebhook(hook);
      });
    });
  return handleCommandStream(s_hooks);
}

function addWebhook (api, params) {
  const { format, event, service } = params.options;
  const eventTypes = event ? event.split(',') : null;
  let services = service ? service.split(',') : null;
  const [name, hookUrl] = params.args;

  const s_results = Notification.getOwnerAndApp(api, params, !params.options.org && !services)
    .flatMapLatest((ownerAndApp) => {
      if (ownerAndApp.appId) {
        services = services || [ownerAndApp.appId];
      }
      const url = { format, url: hookUrl };
      return Notification.add(api, 'webhooks', ownerAndApp.ownerId, name, [url], services, eventTypes);
    })
    .map(() => Logger.println('The webhook has been added'));

  handleCommandStream(s_results);
}

function removeWebhook (api, params) {
  const [notificationId] = params.args;

  const s_results = Notification.getOrgaIdOrUserId(api, params.options.org)
    .flatMapLatest((ownerId) => {
      return Notification.remove(api, 'webhooks', ownerId, notificationId);
    })
    .map(() => Logger.println('The notification has been successfully removed'));
  return handleCommandStream(s_results);
}

module.exports = {
  listWebhooks,
  addWebhook,
  removeWebhook,
};
