import _ from 'lodash';
import {
  addDependency,
  create as createApplication,
  get as getApplication,
  getAll as getAllApplications,
  getAllDependencies,
  redeploy as redeployApplication,
  remove as removeApplication,
  removeDependency,
  update as updateApplication,
} from '@clevercloud/client/esm/api/v2/application.js';
import cliparse from 'cliparse';
import { getSummary } from '@clevercloud/client/esm/api/v2/user.js';
import colors from 'colors/safe.js';

import * as AppConfiguration from './app_configuration.js';
import { confirmAnswer } from '../lib/prompts.js';
import { Logger } from '../logger.js';
import * as Organisation from './organisation.js';
import * as User from './user.js';

import { sendToApi } from '../models/send-to-api.js';
import { resolveOwnerId } from './ids-resolver.js';
import { getAvailableInstances } from '@clevercloud/client/esm/api/v2/product.js';

export function listAvailableTypes () {
  return cliparse.autocomplete.words(['docker', 'elixir', 'frankenphp', 'go', 'gradle', 'haskell', 'jar', 'linux', 'maven', 'meteor', 'node', 'php', 'play1', 'play2', 'python', 'ruby', 'rust', 'sbt', 'static', 'static-apache', 'v', 'war']);
};

export const AVAILABLE_ZONES = ['par', 'parhds', 'grahds', 'rbx', 'rbxhds', 'scw', 'ldn', 'mtl', 'sgp', 'syd', 'wsw'];

export function listAvailableZones () {
  return cliparse.autocomplete.words(AVAILABLE_ZONES);
};

export function listAvailableAliases () {
  return AppConfiguration.loadApplicationConf().then(({ apps }) => cliparse.autocomplete.words(_.map(apps, 'alias')));
};

export function listAvailableFlavors () {
  return ['pico', 'nano', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
};

async function getId (ownerId, dependency) {
  if (dependency.app_id) {
    return dependency.app_id;
  }
  const app = await getByName(ownerId, dependency.app_name);
  return app.id;
};

async function getInstanceType (type) {

  // TODO: We should be able to use it without {}
  const types = await getAvailableInstances({}).then(sendToApi);

  const enabledTypes = types.filter((t) => t.enabled);
  const matchingVariants = enabledTypes.filter((t) => t.variant != null && t.variant.slug === type);
  const instanceVariant = _.sortBy(matchingVariants, 'version').reverse()[0];
  if (instanceVariant == null) {
    throw new Error(type + ' type does not exist.');
  }
  return instanceVariant;
};

export async function create (name, typeName, region, orgaIdOrName, github, isTask, envVars) {
  Logger.debug('Create the application…');

  const ownerId = (orgaIdOrName != null)
    ? await Organisation.getId(orgaIdOrName)
    : await User.getCurrentId();

  const instanceType = await getInstanceType(typeName);

  const newApp = {
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
    instanceLifetime: isTask ? 'TASK' : 'REGULAR',
    env: envVars,
  };

  if (github != null) {
    newApp.oauthService = 'github';
    newApp.oauthApp = github;
  }

  return createApplication({ id: ownerId }, newApp).then(sendToApi);
};

export async function deleteApp (app, skipConfirmation) {
  Logger.debug('Deleting app: ' + app.name + ' (' + app.id + ')');

  if (!skipConfirmation) {
    await confirmAnswer(
      `Deleting an application can't be undone, please type ${colors.green(app.name)} to confirm:`,
      'No confirmation, aborting application deletion',
      app.name,
    );
  }

  return removeApplication({ id: app.ownerId, appId: app.id }).then(sendToApi);
};

export async function getAllApps (ownerId) {

  const summary = await getSummary().then(sendToApi);

  const orgaWithApps = await Promise.all(
    summary.organisations
      // If owner ID is present, only keep the matching org
      .filter((org) => ownerId == null || org.id === ownerId)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(async (org) => {
        const applications = await getApplicationsForOwner(org.id);
        return {
          id: org.id,
          name: org.name,
          applications: applications.sort((a, b) => a.name.localeCompare(b.name)),
        };
      }),
  );

  return orgaWithApps;
};

async function getApplicationsForOwner (ownerId) {
  const rawApplications = await getAllApplications({ id: ownerId }).then(sendToApi);
  return rawApplications.map((app) => {
    return {
      app_id: app.id,
      org_id: ownerId,
      name: app.name,
      zone: app.zone,
      type: app.instance.variant.slug,
      createdAt: new Date(app.creationDate).toISOString(),
      deploy_url: app.deployment.httpUrl,
      git_ssh_url: app.deployment.url,
    };
  });
}

function getApplicationByName (apps, name) {
  const filteredApps = apps.filter((app) => app.name === name);
  if (filteredApps.length === 1) {
    return filteredApps[0];
  }
  else if (filteredApps.length === 0) {
    throw new Error('Application not found');
  }
  throw new Error('Ambiguous application name');
};

async function getByName (ownerId, name) {
  const apps = await getAllApplications({ id: ownerId }).then(sendToApi);
  return getApplicationByName(apps, name);
};

function addInstanceLifetime (app) {
  // Patch to help config commands
  app.instanceLifetime = app.instance.lifetime;
  return app;
}

export function get (ownerId, appId) {
  Logger.debug(`Get information for the app: ${appId}`);
  return getApplication({ id: ownerId, appId }).then(sendToApi).then(addInstanceLifetime);
};

export function updateOptions (ownerId, appId, options) {
  Logger.debug(`Update app: ${appId}`);
  return updateApplication({ id: ownerId, appId }, options).then(sendToApi).then(addInstanceLifetime);
};

function getFromSelf (appId) {
  Logger.debug(`Get information for the app: ${appId}`);
  // /self differs from /organisations only for this one:
  // it fallbacks to the organisations of which the user
  // is a member, if it doesn't belong to Personal Space.
  return getApplication({ appId }).then(sendToApi);
};

/**
 * @param {{app_id: string}|{app_name: string}} appIdOrName
 * @param {string} alias
 * @return {Promise<{appId: string, ownerId: string}>}
 */
export async function resolveId (appIdOrName, alias) {
  if (appIdOrName != null && alias != null) {
    throw new Error('Only one of the `--app` or `--alias` options can be set at a time');
  }

  // -- resolve by linked app

  if (appIdOrName == null) {
    const appDetails = await AppConfiguration.getAppDetails({ alias });
    return { appId: appDetails.appId, ownerId: appDetails.ownerId };
  }

  // -- resolve by app id

  if (appIdOrName.app_id != null) {
    const ownerId = await resolveOwnerId(appIdOrName.app_id);
    if (ownerId != null) {
      return {
        appId: appIdOrName.app_id,
        ownerId,
      };
    }

    throw new Error('Application not found');
  }

  // -- resolve by app name

  const summary = await getSummary({}).then(sendToApi);

  const candidates = [summary.user, ...summary.organisations]
    .flatMap((owner) => owner.applications.map((app) => ({ app, owner })))
    .filter((candidate) => candidate.app.name === appIdOrName.app_name);

  if (candidates.length === 0) {
    throw new Error('Application not found');
  }
  if (candidates.length === 1) {
    return {
      appId: candidates[0].app.id,
      ownerId: candidates[0].owner.id,
    };
  }

  Logger.printErrorLine(`The name '${appIdOrName.app_name}' refers to multiple applications:`);
  candidates.forEach((candidate) => {
    Logger.printErrorLine(`- ${candidate.owner.name}: ${candidate.app.id} (${candidate.app.variantSlug})`);
  });
  throw new Error('Ambiguous application name, use the `--app` option with one of the IDs above');
}

export async function linkRepo (app, orgaIdOrName, alias, ignoreParentConfig) {
  Logger.debug(`Linking current repository to the app: ${app.app_id || app.app_name}`);

  const ownerId = (orgaIdOrName != null)
    ? await Organisation.getId(orgaIdOrName)
    : await User.getCurrentId();

  const appData = (app.app_id != null)
    ? await getFromSelf(app.app_id)
    : await getByName(ownerId, app.app_name);

  return AppConfiguration.addLinkedApplication(appData, alias, ignoreParentConfig);
};

export function unlinkRepo (alias) {
  Logger.debug(`Unlinking current repository from the app: ${alias}`);
  return AppConfiguration.removeLinkedApplication({ alias });
};

export function redeploy (ownerId, appId, commit, withoutCache) {
  Logger.debug(`Redeploying the app: ${appId}`);
  const useCache = (withoutCache) ? 'no' : null;
  return redeployApplication({ id: ownerId, appId, commit, useCache }).then(sendToApi);
};

export function mergeScalabilityParameters (scalabilityParameters, instance) {
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

export async function setScalability (appId, ownerId, scalabilityParameters, buildFlavor) {
  Logger.info('Scaling the app: ' + appId);

  const app = await getApplication({ id: ownerId, appId }).then(sendToApi);
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

  return updateApplication({ id: ownerId, appId }, newConfig).then(sendToApi);
};

export async function listDependencies (ownerId, appId, showAll) {
  const applicationDeps = await getAllDependencies({ id: ownerId, appId }).then(sendToApi);

  if (!showAll) {
    return applicationDeps.map((app) => ({ ...app, isLinked: true }));
  }

  const allApps = await getAllApplications({ id: ownerId }).then(sendToApi);

  const applicationDepsIds = applicationDeps.map((app) => app.id);
  return allApps.map((app) => {
    const isLinked = applicationDepsIds.includes(app.id);
    return { ...app, isLinked };
  });
}

export async function link (ownerId, appId, dependency) {
  const dependencyId = await getId(ownerId, dependency);
  return addDependency({ id: ownerId, appId, dependencyId }).then(sendToApi);
};

export async function unlink (ownerId, appId, dependency) {
  const dependencyId = await getId(ownerId, dependency);
  return removeDependency({ id: ownerId, appId, dependencyId }).then(sendToApi);
};
