'use strict';

const _ = require('lodash');
const application = require('@clevercloud/client/cjs/api/application.js');
const autocomplete = require('cliparse').autocomplete;
const Bacon = require('baconjs');

const AppConfiguration = require('./app_configuration.js');
const Interact = require('./interact.js');
const Logger = require('../logger.js');
const Organisation = require('./organisation.js');

const { sendToApi } = require('../models/send-to-api.js');

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

async function getIdProm (ownerId, dependency) {
  if (dependency.app_id) {
    return dependency.app_id;
  }
  const app = await getByNameProm(ownerId, dependency.app_name);
  return app.id;
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

async function deleteApp (addDetails, skipConfirmation) {
  Logger.debug('Deleting app: ' + addDetails.name + ' (' + addDetails.appId + ')');

  if (!skipConfirmation) {
    await Interact.confirm(
      `Deleting the application ${addDetails.name} can't be undone, please type '${addDetails.name}' to confirm: `,
      'No confirmation, aborting application deletion',
      [addDetails.name]).toPromise();
  }

  return application.remove({ id: addDetails.ownerId, appId: addDetails.appId }).then(sendToApi);
};

function getApplicationByName (s_apps, name) {
  return s_apps.flatMapLatest((apps) => {
    return getApplicationByNameProm(apps, name);
  });
};

function getApplicationByNameProm (apps, name) {
  const filteredApps = apps.filter((app) => app.name === name);
  if (filteredApps.length === 1) {
    return filteredApps[0];
  }
  else if (filteredApps.length === 0) {
    throw new Error('Application not found');
  }
  throw new Error('Ambiguous application name');
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
}

async function getByNameProm (ownerId, name) {
  const apps = await application.getAll({ id: ownerId }).then(sendToApi);
  return getApplicationByNameProm(apps, name);
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

function unlinkRepo (alias) {
  Logger.debug(`Unlinking current repository from the app: ${alias}`);
  return AppConfiguration.removeLinkedApplication(alias);
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

async function setScalability (appId, ownerId, scalabilityParameters, buildFlavor) {
  Logger.info('Scaling the app: ' + appId);

  const app = await application.get({ id: ownerId, appId }).then(sendToApi);
  const instance = _.cloneDeep(app.instance);

  instance.minFlavor = instance.minFlavor.name;
  instance.maxFlavor = instance.maxFlavor.name;

  const newConfig = mergeScalabilityParameters(scalabilityParameters, instance);

  if (buildFlavor != null) {
    newConfig.separateBuild = (buildFlavor !== 'disabled');
    if (buildFlavor !== 'disabled') {
      newConfig.buildFlavor = buildFlavor;
    }
    else {
      Logger.info('No build size given, disabling dedicated build instance');
    }
  }

  return application.update({ id: ownerId, appId }, newConfig).then(sendToApi);
};

async function listDependencies (ownerId, appId, showAll) {
  const applicationDeps = await application.getAllDependencies({ id: ownerId, appId }).then(sendToApi);

  if (!showAll) {
    return applicationDeps;
  }

  const allApps = await application.getAll({ id: ownerId }).then(sendToApi);

  const applicationDepsIds = applicationDeps.map((app) => app.id);
  return allApps.map((app) => {
    const isLinked = applicationDepsIds.includes(app.id);
    return { ...app, isLinked };
  });
}

async function link (ownerId, appId, dependency) {
  const dependencyId = await getIdProm(ownerId, dependency);
  return application.addDependency({ id: ownerId, appId, dependencyId }).then(sendToApi);
};

async function unlink (ownerId, appId, dependency) {
  const dependencyId = await getIdProm(ownerId, dependency);
  return application.removeDependency({ id: ownerId, appId, dependencyId }).then(sendToApi);
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
  redeploy,
  mergeScalabilityParameters,
  setScalability,
  listDependencies,
  link,
  unlink,
};
