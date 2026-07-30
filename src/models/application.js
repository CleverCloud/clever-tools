import { CreateApplicationCommand } from '@clevercloud/client/cc-api-commands/application/create-application-command.js';
import { DeleteApplicationCommand } from '@clevercloud/client/cc-api-commands/application/delete-application-command.js';
import { DeployApplicationCommand } from '@clevercloud/client/cc-api-commands/application/deploy-application-command.js';
import { GetApplicationCommand } from '@clevercloud/client/cc-api-commands/application/get-application-command.js';
import { ListApplicationCommand } from '@clevercloud/client/cc-api-commands/application/list-application-command.js';
import { UpdateApplicationCommand } from '@clevercloud/client/cc-api-commands/application/update-application-command.js';
import { AddLinkCommand } from '@clevercloud/client/cc-api-commands/link/add-link-command.js';
import { ListLinkCommand } from '@clevercloud/client/cc-api-commands/link/list-link-command.js';
import { RemoveLinkCommand } from '@clevercloud/client/cc-api-commands/link/remove-link-command.js';
import { GetOrganisationSummariesCommand } from '@clevercloud/client/cc-api-commands/organisation/get-organisation-summaries-command.js';
import { ListProductRuntimeCommand } from '@clevercloud/client/cc-api-commands/product/list-product-runtime-command.js';
import { toArray } from '@clevercloud/client/utils/environment-utils.js';
import { tolerateNotFound } from '@clevercloud/client/utils/error-utils.js';
import _ from 'lodash';
import { confirmAnswer } from '../lib/prompts.js';
import { styleText } from '../lib/style-text.js';
import { Logger } from '../logger.js';
import * as AppConfiguration from './app_configuration.js';
import { clients } from './cc-api-client.js';
import { resolveOwnerId } from './ids-resolver.js';
import * as Organisation from './organisation.js';
import * as User from './user.js';

export function listAvailableTypes() {
  return [
    'docker',
    'elixir',
    'frankenphp',
    'go',
    'gradle',
    'haskell',
    'jar',
    'linux',
    'maven',
    'meteor',
    'node',
    'php',
    'play1',
    'play2',
    'python',
    'ruby',
    'rust',
    'sbt',
    'static',
    'static-apache',
    'v',
    'war',
  ];
}

export const AVAILABLE_ZONES = ['par', 'parhds', 'grahds', 'rbx', 'rbxhds', 'scw', 'ldn', 'mtl', 'sgp', 'syd', 'wsw'];

export function listAvailableZones() {
  return AVAILABLE_ZONES;
}

export function listAvailableAliases() {
  return AppConfiguration.loadApplicationConf().then(({ apps }) => _.map(apps, 'alias'));
}

export function listAvailableFlavors() {
  return ['pico', 'nano', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
}

async function getId(ownerId, dependency) {
  if (dependency.app_id) {
    return dependency.app_id;
  }
  const app = await getByName(ownerId, dependency.app_name);
  return app.id;
}

async function getInstanceType(type) {
  const types = await clients.ccApi.send(new ListProductRuntimeCommand());

  const enabledTypes = types.filter((t) => t.isEnabled);
  const matchingVariants = enabledTypes.filter((t) => t.variant != null && t.variant.slug === type);
  const instanceVariant = _.sortBy(matchingVariants, 'version').reverse()[0];
  if (instanceVariant == null) {
    throw new Error(type + ' type does not exist.');
  }
  return instanceVariant;
}

export async function create(name, typeName, region, orgaIdOrName, github, isTask, envVars) {
  Logger.debug('Create the application…');

  const ownerId = orgaIdOrName != null ? await Organisation.getId(orgaIdOrName) : await User.getCurrentId();

  const instanceType = await getInstanceType(typeName);

  return clients.ccApi.send(
    new CreateApplicationCommand({
      ownerId,
      name,
      description: name,
      deploy: 'git',
      instance: {
        type: instanceType.type,
        version: instanceType.version,
        variant: instanceType.variant.id,
      },
      minFlavor: instanceType.defaultFlavor.name,
      maxFlavor: instanceType.defaultFlavor.name,
      minInstances: 1,
      maxInstances: 1,
      zone: region,
      instanceLifetime: isTask ? 'TASK' : 'REGULAR',
      environment: toArray(envVars ?? {}),
      oauthApp: github != null ? { type: 'github', id: `${github.owner}/${github.name}` } : undefined,
    }),
  );
}

export async function deleteApp(app, skipConfirmation) {
  Logger.debug('Deleting app: ' + app.name + ' (' + app.id + ')');

  if (!skipConfirmation) {
    await confirmAnswer(
      `Deleting an application can't be undone, please type ${styleText('green', app.name)} to confirm:`,
      'No confirmation, aborting application deletion',
      app.name,
    );
  }

  return clients.ccApi.send(new DeleteApplicationCommand({ ownerId: app.ownerId, applicationId: app.id }));
}

export async function getAllApps(ownerId) {
  const summaries = await clients.ccApi.send(new GetOrganisationSummariesCommand());

  const orgaWithApps = await Promise.all(
    summaries
      // The client answers with every owner, the personal one included, where the v2 summary this
      // used to read kept it apart: listing it would add an entry `clever applications` never had.
      // See src/legacy-json/README.md.
      .filter((org) => !org.isPersonal)
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
}

async function getApplicationsForOwner(ownerId) {
  const rawApplications = await clients.ccApi.send(new ListApplicationCommand({ ownerId }));
  return rawApplications.map((app) => {
    return {
      app_id: app.id,
      org_id: ownerId,
      name: app.name,
      zone: app.zone,
      type: app.instance.variant.slug,
      createdAt: new Date(app.createdAt).toISOString(),
      deploy_url: app.deployment.httpUrl,
      git_ssh_url: app.deployment.url,
    };
  });
}

function getApplicationByName(apps, name) {
  const filteredApps = apps.filter((app) => app.name === name);
  if (filteredApps.length === 1) {
    return filteredApps[0];
  } else if (filteredApps.length === 0) {
    throw new Error('Application not found');
  }
  throw new Error('Ambiguous application name');
}

async function getByName(ownerId, name) {
  const apps = await clients.ccApi.send(new ListApplicationCommand({ ownerId }));
  return getApplicationByName(apps, name);
}

export async function get(ownerId, appId) {
  Logger.debug(`Get information for the app: ${appId}`);
  const app = await tolerateNotFound(clients.ccApi.send(new GetApplicationCommand({ ownerId, applicationId: appId })));
  if (app == null) {
    throw new Error('Application not found');
  }
  return app;
}

export function updateOptions(ownerId, appId, options) {
  Logger.debug(`Update app: ${appId}`);
  return clients.ccApi.send(new UpdateApplicationCommand({ ownerId, applicationId: appId, ...options }));
}

/**
 * @param {{app_id: string}|{app_name: string}} appIdOrName
 * @param {string} alias
 * @return {Promise<{appId: string, ownerId: string}>}
 */
export async function resolveId(appIdOrName, alias) {
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

  const summaries = await clients.ccApi.send(new GetOrganisationSummariesCommand());

  const candidates = summaries
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

export async function linkRepo(app, orgaIdOrName, alias, ignoreParentConfig) {
  Logger.debug(`Linking current repository to the app: ${app.app_id || app.app_name}`);

  let appData;
  if (app.app_id != null) {
    const ownerId = await resolveOwnerId(app.app_id);
    if (ownerId == null) {
      throw new Error('Application not found');
    }
    appData = await get(ownerId, app.app_id);
  } else {
    const ownerId = orgaIdOrName != null ? await Organisation.getId(orgaIdOrName) : await User.getCurrentId();
    appData = await getByName(ownerId, app.app_name);
  }

  return AppConfiguration.addLinkedApplication(appData, alias, ignoreParentConfig);
}

export function unlinkRepo(alias) {
  Logger.debug(`Unlinking current repository from the app: ${alias}`);
  return AppConfiguration.removeLinkedApplication({ alias });
}

export function redeploy(ownerId, appId, commit, withoutCache) {
  Logger.debug(`Redeploying the app: ${appId}`);
  return clients.ccApi.send(
    new DeployApplicationCommand({ ownerId, applicationId: appId, commit, useCache: withoutCache ? false : null }),
  );
}

export function mergeScalabilityParameters(scalabilityParameters, instance) {
  const flavors = listAvailableFlavors();

  if (scalabilityParameters.minFlavor) {
    instance.minFlavor = scalabilityParameters.minFlavor;
    if (flavors.indexOf(instance.minFlavor) > flavors.indexOf(instance.maxFlavor)) {
      instance.maxFlavor = instance.minFlavor;
    }
  }
  if (scalabilityParameters.maxFlavor) {
    instance.maxFlavor = scalabilityParameters.maxFlavor;
    if (
      flavors.indexOf(instance.minFlavor) > flavors.indexOf(instance.maxFlavor) &&
      scalabilityParameters.minFlavor == null
    ) {
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
}

export async function setScalability(appId, ownerId, scalabilityParameters, buildFlavor) {
  Logger.info('Scaling the app: ' + appId);

  const app = await get(ownerId, appId);

  const instance = {
    minFlavor: app.instance.minFlavor.name,
    maxFlavor: app.instance.maxFlavor.name,
    minInstances: app.instance.minInstances,
    maxInstances: app.instance.maxInstances,
  };

  const newConfig = mergeScalabilityParameters(scalabilityParameters, instance);

  if (buildFlavor != null) {
    newConfig.hasSeparatedBuild = buildFlavor !== 'disabled';
    if (buildFlavor !== 'disabled') {
      newConfig.buildFlavor = buildFlavor;
    } else {
      Logger.info('No build size given, disabling dedicated build instance');
    }
  }

  return updateOptions(ownerId, appId, newConfig);
}

export async function listDependencies(ownerId, appId, showAll) {
  const links = await clients.ccApi.send(new ListLinkCommand({ ownerId, applicationId: appId }));
  const applicationDeps = links.filter((link) => link.type === 'link-to-application');

  if (!showAll) {
    return applicationDeps.map((dep) => ({ ...dep.application, isLinked: true }));
  }

  const allApps = await clients.ccApi.send(new ListApplicationCommand({ ownerId }));

  const applicationDepsIds = applicationDeps.map((dep) => dep.application.id);
  return allApps.map((app) => {
    const isLinked = applicationDepsIds.includes(app.id);
    return { ...app, isLinked };
  });
}

export async function link(ownerId, appId, dependency) {
  const dependencyId = await getId(ownerId, dependency);
  return clients.ccApi.send(new AddLinkCommand({ ownerId, applicationId: appId, targetApplicationId: dependencyId }));
}

export async function unlink(ownerId, appId, dependency) {
  const dependencyId = await getId(ownerId, dependency);
  return clients.ccApi.send(
    new RemoveLinkCommand({ ownerId, applicationId: appId, targetApplicationId: dependencyId }),
  );
}
