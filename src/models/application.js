'use strict';

const _ = require('lodash');
const Bacon = require('baconjs');
const autocomplete = require('cliparse').autocomplete;

const AppConfiguration = require('./app_configuration.js');
const Interact = require('./interact.js');
const Logger = require('../logger.js');
const Organisation = require('./organisation.js');

const { sendToApi } = require('../models/send-to-api.js');
const application = require('@clevercloud/client/cjs/api/application.js');

function listAvailableTypes () {
  return autocomplete.words(['docker', 'elixir', 'go', 'gradle', 'haskell', 'jar', 'maven', 'node', 'php', 'play1', 'play2', 'python', 'ruby', 'rust', 'sbt', 'static-apache', 'war']);
};

function listAvailableZones () {
  return autocomplete.words(['par', 'mtl']);
};

function listAvailableAliases () {
  const s_aliases = AppConfiguration.loadApplicationConf().map((conf) => {
    return _.map(conf.apps, 'alias');
  });
  return s_aliases.toPromise().then(autocomplete.words);
};

function listAvailableFlavors () {
  return ['pico', 'nano', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
};

function getId (api, orgaId, appIdOrName) {
  if (appIdOrName.app_id) {
    return Bacon.once(appIdOrName.app_id);
  }
  return getByName(api, appIdOrName.app_name, orgaId && { orga_id: orgaId })
    .map((app) => app.id);
};

function getInstanceType (api, type) {
  const s_types = api.products.instances.get().send();

  return s_types.flatMapLatest(function (types) {
    const enabledTypes = _.filter(types, (t) => t.enabled);
    const matchingVariants = _.filter(enabledTypes, (t) => t.variant && t.variant.slug === type);
    const instanceVariant = _.sortBy(matchingVariants, 'version').reverse()[0];
    return instanceVariant ? Bacon.once(instanceVariant) : new Bacon.Error(type + ' type does not exist.');
  });
};

function create (api, name, instanceType, region, orgaIdOrName, github) {
  Logger.debug('Create the application…');
  return Organisation.getId(api, orgaIdOrName).flatMapLatest((orgaId) => {
    const params = orgaId ? [orgaId] : [];

    const body = {
      deploy: 'git',
      description: name,
      instanceType: instanceType.type,
      instanceVersion: instanceType.version,
      instanceVariant: instanceType.variant.id,
      maxFlavor: instanceType.defaultFlavor.name,
      maxInstances: 1,
      minFlavor: instanceType.defaultFlavor.name,
      minInstances: 1,
      name: name,
      zone: region,
    };

    if (github) {
      body.oauthService = 'github';
      body.oauthApp = github;
    }

    return api.owner(orgaId).applications.post().withParams(params).send(JSON.stringify(body));
  });
};

function deleteApp (api, app_data, skipConfirmation) {
  Logger.debug('Deleting app: ' + app_data.name + ' (' + app_data.app_id + ')');

  const s_confirmation = skipConfirmation
    ? Bacon.once()
    : Interact.confirm(
      'Deleting the application ' + app_data.name + ' can\'t be undone, please type \'' + app_data.name + '\' to confirm: ',
      'No confirmation, aborting application deletion',
      [app_data.name]);

  return s_confirmation.flatMapLatest(function () {
    return performDeletion(api, app_data.app_id, app_data.org_id);
  });
};

function performDeletion (api, appId, orgaId) {
  const params = orgaId ? [orgaId, appId] : [appId];
  return api.owner(orgaId).applications._.delete().withParams(params).send();
};

function getApplicationByName (s_apps, name) {
  const s_app = s_apps.flatMapLatest(function (apps) {
    const filtered_apps = _.filter(apps, function (app) {
      return app.name === name;
    });
    if (filtered_apps.length === 1) {
      return Bacon.once(filtered_apps[0]);
    }
    else if (filtered_apps.length === 0) {
      return Bacon.once(new Bacon.Error('Application not found'));
    }
    else {
      return Bacon.once(new Bacon.Error('Ambiguous application name'));
    }
  });

  return s_app;
};

function getByName (api, name, orgaIdOrName) {
  if (!orgaIdOrName) {
    const s_apps = api.owner().applications.get().send();
    return getApplicationByName(s_apps, name);
  }
  else {
    const s_apps = Organisation.getId(api, orgaIdOrName).flatMapLatest(function (orgaId) {
      return api.owner(orgaId).applications.get().withParams([orgaId]).send();
    });
    return getApplicationByName(s_apps, name);
  }
};

function get (api, appId, orgaId) {
  Logger.debug(`Get information for the app: ${appId}`);
  const params = orgaId ? [orgaId, appId] : [appId];
  return api.owner(orgaId).applications._.get().withParams(params).send();
};

function linkRepo (api, appIdOrName, orgaIdOrName, alias, ignoreParentConfig) {
  Logger.debug(`Linking current repository to the app: ${appIdOrName.app_id || appIdOrName.app_name}`);

  const s_app = (appIdOrName.app_id != null)
    ? get(api, appIdOrName.app_id)
    : getByName(api, appIdOrName.app_name, orgaIdOrName);

  return s_app.flatMapLatest((appData) => {
    return AppConfiguration.addLinkedApplication(appData, alias, ignoreParentConfig);
  });
};

function unlinkRepo (api, alias) {
  Logger.debug(`Unlinking current repository from the app: ${alias}`);
  return AppConfiguration.removeLinkedApplication(alias);
};

function stop (api, appId, orgaId) {
  Logger.debug(`Stopping the app: ${appId}`);
  const params = orgaId ? [orgaId, appId] : [appId];
  return api.owner(orgaId).applications._.instances.delete().withParams(params).send();
};

function redeploy (api, appId, orgaId, commitId, withoutCache) {
  Logger.debug(`Redeploying the app: ${appId}`);
  const params = orgaId ? [orgaId, appId] : [appId];
  const query = {};
  if (commitId) {
    query.commit = commitId;
  }
  if (withoutCache) {
    query.useCache = 'no';
  }
  return api.owner(orgaId).applications._.instances.post()
    .withParams(params)
    .withQuery(query)
    .send();
};

function mergeScalabilityParameters (scalabilityParameters, instance) {
  const flavors = listAvailableFlavors();

  if (scalabilityParameters.minFlavor) {
    instance.minFlavor = scalabilityParameters.minFlavor;
    if (flavors.indexOf(instance.minFlavor) > flavors.indexOf(instance.maxFlavor)) {
      instance.maxFlavor = instance.minFlavor;
    }
  }
  if (scalabilityParameters.maxFlavor) {
    instance.maxFlavor = scalabilityParameters.maxFlavor;
    if (flavors.indexOf(instance.minFlavor) > flavors.indexOf(instance.maxFlavor)
      && scalabilityParameters.minFlavor == null) {
      instance.minFlavor = instance.maxFlavor;
    }
  }

  if (scalabilityParameters.minInstances) {
    instance.minInstances = scalabilityParameters.minInstances;
    if (instance.minInstances > instance.maxInstances) {
      instance.maxInstances = instance.minInstances;
    }
  }
  if (scalabilityParameters.maxInstances) {
    instance.maxInstances = scalabilityParameters.maxInstances;
    if (instance.minInstances > instance.maxInstances && scalabilityParameters.minInstances == null) {
      instance.minInstances = instance.maxInstances;
    }
  }
  return instance;
};

async function setScalability (appId, orgaId, scalabilityParameters) {
  Logger.info('Scaling the app: ' + appId);

  const app = await application.get({ id: orgaId, appId }).then(sendToApi);
  const instance = _.cloneDeep(app.instance);

  instance.minFlavor = instance.minFlavor.name;
  instance.maxFlavor = instance.maxFlavor.name;

  const newConfig = mergeScalabilityParameters(scalabilityParameters, instance);

  return application.update({ id: orgaId, appId }, newConfig).then(sendToApi);
};

async function setDedicatedBuildInstance (appId, orgaId, enableSeparateBuild) {
  const app = await application.get({ id: orgaId, appId }).then(sendToApi);
  const newConfig = { ...app, separateBuild: enableSeparateBuild };
  return application.update({ id: orgaId, appId }, newConfig).then(sendToApi);
};

async function setBuildFlavor (appId, orgaId, buildInstanceSize) {
  Logger.info('Setting build size for app: ' + appId);
  if (buildInstanceSize !== null) {
    const body = { flavorName: buildInstanceSize };
    await setDedicatedBuildInstance(appId, orgaId, true);
    return application.setBuildInstanceFlavor({ id: orgaId, appId }, body).then(sendToApi);
  }
  else {
    Logger.info('No build size given, disabling dedicated build instance');
    return setDedicatedBuildInstance(appId, orgaId, false);
  }
};

function listDependencies (api, appId, orgaId, showAll) {
  const s_all = api.owner(orgaId).applications.get().withParams(orgaId ? [orgaId] : []).send();
  const s_mine = api.owner(orgaId).applications._.dependencies.get().withParams(orgaId ? [orgaId, appId] : [appId]).send();

  if (!showAll) {
    return s_mine;
  }
  else {
    return s_all.flatMapLatest(function (all) {
      return s_mine.flatMapLatest(function (mine) {
        const mineIds = _.map(mine, 'id');
        return _.map(all, function (app) {
          if (_.includes(mineIds, app.id)) {
            return _.assign({}, app, { isLinked: true });
          }
          else {
            return app;
          }
        });
      });
    });
  }
};

function link (api, appId, orgaId, appIdOrName) {
  const s_appIdToLink = getId(api, orgaId, appIdOrName);

  return s_appIdToLink.flatMapLatest(function (appIdToLink) {
    const params = orgaId ? [orgaId, appId, appIdToLink] : [appId, appIdToLink];
    return api.owner(orgaId).applications._.dependencies._.put().withParams(params).send();
  });
};

function unlink (api, appId, orgaId, appIdOrName) {
  const s_linkedAppId = getId(api, orgaId, appIdOrName);

  return s_linkedAppId.flatMapLatest(function (linkedAppId) {
    const params = orgaId ? [orgaId, appId, linkedAppId] : [appId, linkedAppId];
    return api.owner(orgaId).applications._.dependencies._.delete().withParams(params).send();
  });
};

module.exports = {
  listAvailableTypes,
  listAvailableZones,
  listAvailableAliases,
  listAvailableFlavors,
  getId,
  getInstanceType,
  create,
  deleteApp,
  getByName,
  get,
  linkRepo,
  unlinkRepo,
  stop,
  redeploy,
  mergeScalabilityParameters,
  setScalability,
  setBuildFlavor,
  listDependencies,
  link,
  unlink,
};
