'use strict';

const _ = require('lodash');
const Bacon = require('baconjs');
const colors = require('colors/safe');

const Addon = require('../models/addon.js');
const AppConfig = require('../models/app_configuration.js');
const formatTable = require('../format-table')();
const handleCommandStream = require('../command-stream-handler');
const Logger = require('../logger.js');
const Organisation = require('../models/organisation.js');

function list (api, params) {
  const { org: orgaIdOrName } = params.options;

  const s_addons = Organisation.getId(api, orgaIdOrName)
    .flatMapLatest((ownerId) => Bacon.fromPromise(Addon.list(ownerId)))
    .map((addons) => {
      const formattedAddons = addons.map((addon) => {
        return [
          addon.plan.name + ' ' + addon.provider.name,
          addon.region,
          colors.bold.green(addon.name),
          addon.id,
        ];
      });
      Logger.println(formatTable(formattedAddons));
    });

  handleCommandStream(s_addons);
}

function create (api, params) {
  const [providerName, name] = params.args;
  const { link, plan, region, yes: skipConfirmation, org: orgaIdOrName } = params.options;

  const s_result = Organisation.getId(api, orgaIdOrName)
    .flatMapLatest((orgaId) => {
      if (link) {
        return AppConfig.getAppData(link).flatMapLatest((appData) => {
          if (orgaIdOrName != null && appData.orgaId !== orgaId) {
            Logger.warn('The specified application does not belong to the specified organisation. Ignoring the `--org` option');
          }
          return Addon.createAndLink(api, name, providerName, plan, region, skipConfirmation, appData);
        });
      }
      return Addon.create(api, orgaId, name, providerName, plan, region, skipConfirmation);
    })
    .map((r) => {
      if (link) {
        Logger.println(`Addon ${name} (id: ${r.id}) successfully created and linked to the application`);
      }
      else {
        Logger.println(`Addon ${name} (id: ${r.id}) successfully created`);
      }
    });

  handleCommandStream(s_result);
}

function deleteAddon (api, params) {
  const { yes: skipConfirmation, org: orgaIdOrName } = params.options;
  const [addonIdOrName] = params.args;

  const s_result = Organisation.getId(api, orgaIdOrName)
    .flatMapLatest((orgaId) => Addon.delete(api, orgaId, addonIdOrName, skipConfirmation))
    .map(() => Logger.println(`Addon ${addonIdOrName.addon_id || addonIdOrName.addon_name} successfully deleted`));

  handleCommandStream(s_result);
}

function rename (api, params) {
  const [addonIdOrName, newName] = params.args;
  const { org: orgaIdOrName } = params.options;

  const s_result = Organisation.getId(api, orgaIdOrName)
    .flatMapLatest((orgaId) => Addon.rename(api, orgaId, addonIdOrName, newName))
    .map(() => Logger.println(`Addon ${addonIdOrName.addon_id || addonIdOrName.addon_name} successfully renamed to ${newName}`));

  handleCommandStream(s_result);
}

function listProviders (api) {

  const s_providers = Addon.listProviders(api)
    .flatMapLatest((providers) => {
      const formattedProviders = providers.map((provider) => {
        return [
          colors.bold(provider.id),
          provider.name,
          provider.shortDesc,
        ];
      });
      Logger.println(formatTable(formattedProviders));
    });

  handleCommandStream(s_providers);
}

function showProvider (api, params) {
  const [providerName] = params.args;

  const s_provider = Addon.getProvider(api, providerName)
    .map((provider) => {

      Logger.println(colors.bold(provider.id));
      Logger.println(`${provider.name}: ${provider.shortDesc}`);
      Logger.println();
      Logger.println(`Available regions: ${provider.regions.join(', ')}`);
      Logger.println();
      Logger.println('Available plans');

      _.forEach(provider.plans, (plan) => {
        Logger.println(`Plan ${colors.bold(plan.slug)}`);
        _(plan.features)
          .sortBy('name')
          .forEach(({ name, value }) => Logger.println(`  ${name}: ${value}`));
      });
    });

  handleCommandStream(s_provider);
}

module.exports = {
  list,
  create,
  delete: deleteAddon,
  rename,
  listProviders,
  showProvider,
};
