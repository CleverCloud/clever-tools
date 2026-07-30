import { CreateAddonCommand } from '@clevercloud/client/cc-api-commands/addon/create-addon-command.js';
import { DeleteAddonCommand } from '@clevercloud/client/cc-api-commands/addon/delete-addon-command.js';
import { GetAddonCommand } from '@clevercloud/client/cc-api-commands/addon/get-addon-command.js';
import { ListAddonCommand } from '@clevercloud/client/cc-api-commands/addon/list-addon-command.js';
import { UpdateAddonCommand } from '@clevercloud/client/cc-api-commands/addon/update-addon-command.js';
import { GetEnvironmentCommand } from '@clevercloud/client/cc-api-commands/environment/get-environment-command.js';
import { AddLinkCommand } from '@clevercloud/client/cc-api-commands/link/add-link-command.js';
import { ListLinkCommand } from '@clevercloud/client/cc-api-commands/link/list-link-command.js';
import { RemoveLinkCommand } from '@clevercloud/client/cc-api-commands/link/remove-link-command.js';
import { GetOrganisationSummariesCommand } from '@clevercloud/client/cc-api-commands/organisation/get-organisation-summaries-command.js';
import { GetProductAddonVersionsCommand } from '@clevercloud/client/cc-api-commands/product/get-product-addon-versions-command.js';
import { ListProductAddonCommand } from '@clevercloud/client/cc-api-commands/product/list-product-addon-command.js';
import { tolerateNotFound } from '@clevercloud/client/utils/error-utils.js';
import { confirm } from '../lib/prompts.js';
import { Logger } from '../logger.js';
import { clients } from './cc-api-client.js';
import { resolveOwnerId } from './ids-resolver.js';

export function listProviders(orgaId) {
  return clients.ccApi.send(new ListProductAddonCommand({ ownerId: orgaId, withVersions: false }));
}

export async function getProvider(providerName, orgaId) {
  const providers = await listProviders(orgaId);
  const provider = providers.find((p) => p.id === providerName);
  if (provider == null) {
    throw new Error(`Invalid provider name. Available providers: ${providers.map((p) => p.id).join(', ')}`);
  }
  return provider;
}

export async function getProviderInfos(providerName) {
  try {
    return await clients.ccApi.send(new GetProductAddonVersionsCommand({ id: providerName }));
  } catch {
    // An error can occur because the add-on api doesn't implement this endpoint yet
    // This is fine, just ignore it
    Logger.debug(`${providerName} doesn't yet implement the provider info endpoint`);
    return null;
  }
}

/**
 * Lists the add-ons of an owner, optionally restricted to the ones a given application links to.
 * @param {string} ownerId The owner ID
 * @param {string} [appId] Only keep the add-ons linked to this application
 * @param {boolean} [showAll] With `appId`, keep every add-on and flag the linked ones
 */
export async function list(ownerId, appId, showAll) {
  const allAddons = await clients.ccApi.send(new ListAddonCommand({ ownerId }));

  if (appId == null) {
    // Not linked to a specific app, show everything
    return allAddons;
  }

  const links = await clients.ccApi.send(new ListLinkCommand({ ownerId, applicationId: appId }));
  const myAddons = links.filter((link) => link.type === 'link-to-addon').map((link) => link.addon);
  if (!showAll) {
    return myAddons.map((addon) => ({ ...addon, isLinked: true }));
  }

  const myAddonIds = myAddons.map((addon) => addon.id);
  return allAddons.map((addon) => {
    const isLinked = myAddonIds.includes(addon.id);
    return { ...addon, isLinked };
  });
}

function validateAddonVersionAndOptions(region, version, addonOptions, providerInfos, planType) {
  if (providerInfos != null) {
    if (version != null) {
      const type = planType.value.toLowerCase();
      if (type === 'shared') {
        const cluster = providerInfos.clusters.find(({ zone }) => zone === region);
        if (cluster == null) {
          throw new Error(`Can't find cluster for region ${region}`);
        } else if (cluster.version !== version) {
          throw new Error(
            `Invalid version ${version}, selected shared cluster only supports version ${cluster.version}`,
          );
        }
      } else if (type === 'dedicated') {
        const availableVersions = Object.keys(providerInfos.dedicated);
        const hasVersion = availableVersions.find((availableVersion) => availableVersion === version);
        if (hasVersion == null) {
          throw new Error(`Invalid version ${version}, available versions are: ${availableVersions.join(', ')}`);
        }
      }
    }

    const chosenVersion = version != null ? version : providerInfos.defaultDedicatedVersion;

    // Check the selected options to see if the chosen plan / region offers them
    // If not, abort the creation
    if (Object.keys(addonOptions).length > 0) {
      const type = planType.value.toLowerCase();
      let availableOptions = [];
      if (type === 'shared') {
        const cluster = providerInfos.clusters.find(({ zone }) => zone === region);
        if (cluster == null) {
          throw new Error(`Can't find cluster for region ${region}`);
        }

        availableOptions = cluster.features;
      } else if (type === 'dedicated') {
        availableOptions = providerInfos.dedicated[chosenVersion].features;
      }

      for (const selectedOption in addonOptions) {
        const isAvailable = availableOptions.find(({ name }) => name === selectedOption);
        if (isAvailable == null) {
          const optionNames = availableOptions.map(({ name }) => name).join(',');
          let availableOptionsError = null;
          if (optionNames.length > 0) {
            availableOptionsError = `Available options are: ${optionNames}.`;
          } else {
            availableOptionsError = 'No options are available for this plan.';
          }

          throw new Error(`Option "${selectedOption}" is not available on this plan. ${availableOptionsError}`);
        }
      }
    }

    return {
      version: chosenVersion,
      ...addonOptions,
    };
  } else {
    if (version != null) {
      throw new Error("You provided a version for an add-on that doesn't support choosing the version.");
    }
    return {};
  }
}

export async function create({ ownerId, name, providerName, planName, region, version, addonOptions }) {
  const provider = await getProvider(providerName, ownerId);

  if (!provider.zones.includes(region)) {
    throw new Error(`Invalid region name. Available regions: ${provider.zones.join(', ')}`);
  }
  if (provider.plans.length === 0) {
    throw new Error(`No plans available for provider ${providerName}`);
  }

  const plan = getPlan(planName, provider.plans);

  const providerInfos = await getProviderInfos(provider.id);
  const planType = plan.features.find(({ name }) => name.toLowerCase() === 'type');

  // If we have a providerInfos but we don't have a planType, we won't be able to go further
  // The process should stop here to make sure users don't create something they don't intend to
  // This missing feature should have been added during the add-on's development phase
  // The console has a similar check so I believe we shouldn't hit this
  if (providerInfos != null && planType == null) {
    throw new Error(
      'Internal error. The selected plan misses the TYPE feature. Please contact our support with the command line you used',
    );
  }

  const createOptions = validateAddonVersionAndOptions(region, version, addonOptions, providerInfos, planType);

  const createdAddon = await clients.ccApi.send(
    new CreateAddonCommand({
      ownerId,
      name,
      zone: region,
      providerId: provider.id,
      planId: plan.id,
      options: createOptions,
    }),
  );

  const { environment } = await clients.ccApi.send(new GetEnvironmentCommand({ ownerId, addonId: createdAddon.id }));
  createdAddon.env = environment;

  return createdAddon;
}

async function getByName(ownerId, addonNameOrRealId) {
  const addons = await clients.ccApi.send(new ListAddonCommand({ ownerId }));
  const filteredAddons = addons.filter(({ name, realId }) => {
    return name === addonNameOrRealId || realId === addonNameOrRealId;
  });
  if (filteredAddons.length === 1) {
    return filteredAddons[0];
  }
  if (filteredAddons.length === 0) {
    throw new Error('Addon not found');
  }
  throw new Error('Ambiguous addon name');
}

async function getId(ownerId, addon) {
  if (addon.addon_id) {
    return addon.addon_id;
  }
  const addonDetails = await getByName(ownerId, addon.addon_name);
  return addonDetails.id;
}

export async function link(ownerId, appId, addon) {
  const addonId = await getId(ownerId, addon);
  return clients.ccApi.send(new AddLinkCommand({ ownerId, applicationId: appId, targetAddonId: addonId }));
}

export async function unlink(ownerId, appId, addon) {
  const addonId = await getId(ownerId, addon);
  return clients.ccApi.send(new RemoveLinkCommand({ ownerId, applicationId: appId, targetAddonId: addonId }));
}

export async function deleteAddon(ownerId, addonIdOrName, skipConfirmation) {
  const addonId = await getId(ownerId, addonIdOrName);

  if (!skipConfirmation) {
    await confirm("Deleting the add-on can't be undone, are you sure?", 'No confirmation, aborting add-on deletion');
  }

  return clients.ccApi.send(new DeleteAddonCommand({ ownerId, addonId }));
}

export async function rename(ownerId, addon, name) {
  const addonId = await getId(ownerId, addon);
  return clients.ccApi.send(new UpdateAddonCommand({ ownerId, addonId, name }));
}

export function completeRegion() {
  return ['par', 'mtl'];
}

// TODO: We need to fix this
export function completePlan() {
  return ['dev', 's', 'm', 'l', 'xl', 'xxl'];
}

export async function findByName(addonName) {
  const owners = await clients.ccApi.send(new GetOrganisationSummariesCommand());
  for (const owner of owners) {
    for (const simpleAddon of owner.addons) {
      if (simpleAddon.name === addonName) {
        const addon = await tolerateNotFound(
          clients.ccApi.send(new GetAddonCommand({ ownerId: owner.id, addonId: simpleAddon.id })),
        );
        if (addon == null) {
          break;
        }
        return {
          ...addon,
          orgaId: owner.id,
        };
      }
    }
  }
  throw new Error(`Could not find add-on with name ${addonName}`);
}

export async function findOwnerId(org, addonId) {
  if (org != null && org.orga_id != null) {
    return org.orga_id;
  }

  const ownerId = await resolveOwnerId(addonId);
  if (ownerId != null) {
    return ownerId;
  }

  throw new Error(`Add-on ${addonId} does not exist`);
}

export function parseAddonOptions(options) {
  if (options == null) {
    return {};
  }

  const pairs = options.split(/,(?=\w+(?:-\w+)*=)/) || [];

  return pairs.reduce((options, pair) => {
    const [key, ...valueParts] = pair.split('=');
    const value = valueParts.join('=');

    if (value == null) {
      throw new Error("Options are malformed. Usage is '--option name=enabled|disabled|true|false|plugin1,plugin2'");
    }

    let formattedValue = value;
    if (value === 'true' || value === 'enabled') {
      formattedValue = 'true';
    } else if (value === 'false' || value === 'disabled') {
      formattedValue = 'false';
    } else if (typeof key === 'string') {
      formattedValue = value;
    } else {
      throw new Error(`Can't parse option value: ${value}. Accepted values are: enabled, disabled, true, false`);
    }

    options[key] = formattedValue;
    return options;
  }, {});
}

function getPlan(planName, plans) {
  // if no plan specified, pick the cheapest one
  if (planName == null || planName === '') {
    return plans.sort((p1, p2) => p1.price - p2.price)[0];
  }

  const plan = plans.find((p) => p.slug.toLowerCase() === planName.toLowerCase());
  if (plan == null) {
    const availablePlans = plans.map((p) => p.slug);
    throw new Error(`Invalid plan name. Available plans: ${availablePlans.join(', ')}`);
  }
  return plan;
}
