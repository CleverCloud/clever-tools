import { styleText } from '../lib/style-text.js';

import { getAllEnvVars } from '@clevercloud/client/esm/api/v2/addon.js';
import { toNameEqualsValueString } from '@clevercloud/client/esm/utils/env-vars.js';
import dedent from 'dedent';
import { getOperator } from '../clever-client/operators.js';
import { formatTable } from '../format-table.js';
import { Logger } from '../logger.js';
import * as Addon from '../models/addon.js';
import { findOwnerId, parseAddonOptions } from '../models/addon.js';
import * as AppConfig from '../models/app_configuration.js';
import { conf } from '../models/configuration.js';
import { resolveAddonId } from '../models/ids-resolver.js';
import * as Organisation from '../models/organisation.js';
import { sendToApi } from '../models/send-to-api.js';
import * as User from '../models/user.js';

export async function list(params) {
  const { org: orgaIdOrName, format } = params.options;

  const ownerId = await Organisation.getId(orgaIdOrName);
  const addons = await Addon.list(ownerId);

  switch (format) {
    case 'json': {
      const formattedAddons = addons.map((addon) => {
        return {
          addonId: addon.id,
          creationDate: addon.creationDate,
          name: addon.name,
          planName: addon.plan.name,
          planSlug: addon.plan.slug,
          providerId: addon.provider.id,
          realId: addon.realId,
          region: addon.region,
          type: addon.provider.name,
        };
      });
      Logger.printJson(formattedAddons);
      break;
    }
    case 'human':
    default: {
      const formattedAddons = addons.map((addon) => {
        return [
          addon.plan.name + ' ' + addon.provider.name,
          addon.region,
          styleText(['bold', 'green'], addon.name),
          addon.id,
        ];
      });
      Logger.println(formatTable(formattedAddons));
    }
  }
}

const ADDON_PROVIDERS = {
  keycloak: {
    name: 'Keycloak',
    isOperator: true,
    postCreateInstructions: `Learn more about Keycloak on Clever Cloud: ${conf.DOC_URL}/addons/keycloak/`,
  },
  kv: {
    name: 'Materia KV',
    isOperator: false,
    status: 'beta',
    postCreateInstructions: (addonId) => dedent`
      ${styleText('yellow', "You can easily use Materia KV with 'redis-cli', with such commands:")}
      ${styleText('blue', `source <(clever addon env ${addonId} -F shell)`)}
      ${styleText('blue', 'redis-cli -h $KV_HOST -p $KV_PORT --tls')}
      Learn more about Materia KV on Clever Cloud: ${conf.DOC_URL}/addons/materia-kv/
    `,
  },
  'addon-matomo': {
    name: 'Matomo',
    isOperator: true,
    postCreateInstructions: `Learn more about Matomo on Clever Cloud: ${conf.DOC_URL}/addons/matomo/`,
  },
  metabase: {
    name: 'Metabase',
    isOperator: true,
    postCreateInstructions: `Learn more about Metabase on Clever Cloud: ${conf.DOC_URL}/addons/metabase/`,
  },
  otoroshi: {
    name: 'Otoroshi with LLM',
    isOperator: true,
    postCreateInstructions: `Learn more about Otoroshi with LLM on Clever Cloud: ${conf.DOC_URL}/addons/otoroshi/`,
  },
  'addon-pulsar': {
    name: 'Pulsar',
    isOperator: false,
    postCreateInstructions: `Learn more about Pulsar on Clever Cloud: ${conf.DOC_URL}/addons/pulsar/`,
  },
};

export async function create(params) {
  const [providerName, name] = params.args;
  const {
    link: linkedAppAlias,
    plan: planName,
    region,
    yes: skipConfirmation,
    org: orgaIdOrName,
    format,
    'addon-version': version,
    option: addonOptions,
  } = params.options;

  const addonToCreate = {
    name,
    providerName,
    planName,
    region,
    skipConfirmation,
    version,
    addonOptions: parseAddonOptions(addonOptions),
  };

  const ownerId = orgaIdOrName != null ? await Organisation.getId(orgaIdOrName) : await User.getCurrentId();
  if (linkedAppAlias != null) {
    const linkedAppData = await AppConfig.getAppDetails({ alias: linkedAppAlias });
    if (orgaIdOrName != null && linkedAppData.ownerId !== ownerId && format === 'human') {
      Logger.warn(
        'The specified application does not belong to the specified organisation. Ignoring the `--org` option',
      );
    }
    addonToCreate.ownerId = linkedAppData.ownerId;
  } else {
    addonToCreate.ownerId = ownerId;
  }

  const newAddon = await Addon.create(addonToCreate);

  if (linkedAppAlias != null) {
    const linkedAppData = await AppConfig.getAppDetails({ alias: linkedAppAlias });
    await Addon.link(linkedAppData.ownerId, linkedAppData.appId, { addon_id: newAddon.id });
  }

  const provider = ADDON_PROVIDERS[providerName];
  let statusMessage = '';
  if (provider?.status) {
    statusMessage = `The ${provider.name} provider is in ${provider.status} testing phase`;
    if (provider.status === 'alpha') {
      statusMessage += ". Don't store sensitive or production grade data.";
    }
  }

  // JSON format
  if (format === 'json') {
    const jsonAddon = {
      id: newAddon.id,
      realId: newAddon.realId,
      name: newAddon.name,
      env: newAddon.env,
    };

    if (provider?.status) {
      jsonAddon.availability = provider.status;
      jsonAddon.message = statusMessage;
    }

    Logger.printJson(jsonAddon);
    return;
  }

  // Human format
  if (linkedAppAlias != null) {
    Logger.println(`Add-on created and linked to application ${linkedAppAlias} successfully!`);
  } else {
    Logger.println('Add-on created successfully!');
  }

  Logger.println(`ID: ${newAddon.id}`);
  Logger.println(`Real ID: ${newAddon.realId}`);
  Logger.println(`Name: ${newAddon.name}`);

  const operator = ADDON_PROVIDERS[providerName]?.isOperator
    ? await getOperator({ provider: providerName, realId: newAddon.realId }).then(sendToApi)
    : null;

  if (operator) {
    if (operator.accessUrl) {
      Logger.println();
      Logger.println(`Your ${ADDON_PROVIDERS[providerName].name} is starting:`);
      Logger.println(` - Access it: ${operator.accessUrl}`);
      Logger.println(` - Manage it: ${conf.GOTO_URL}/${newAddon.id}`);
    }

    if (operator.initialCredentials) {
      if (providerName === 'keycloak') {
        Logger.println();
        Logger.println("An initial account has been created, you'll be invited to change the password at first login:");
        Logger.println(` - Admin user name: ${operator.initialCredentials.user}`);
        Logger.println(` - Temporary password: ${operator.initialCredentials.password}`);
      }
      if (providerName === 'otoroshi') {
        Logger.println();
        Logger.println(
          'An initial account has been created, change the password at first login (Security -> Administrators -> Edit user):',
        );
        Logger.println(` - Admin user name: ${operator.initialCredentials.user}`);
        Logger.println(` - Password: ${operator.initialCredentials.password}`);
      }
    }
  }

  if (provider?.postCreateInstructions) {
    Logger.println();

    if (statusMessage !== '') {
      Logger.println(styleText('yellow', `/!\\ ${statusMessage}`));
    }

    if (typeof provider.postCreateInstructions === 'function') {
      Logger.println(provider.postCreateInstructions(newAddon.id));
    } else {
      Logger.println(provider.postCreateInstructions);
    }
  }
}

export async function deleteAddon(params) {
  const { yes: skipConfirmation, org: orgaIdOrName } = params.options;
  const [addon] = params.args;

  let ownerId = await Organisation.getId(orgaIdOrName);
  if (ownerId == null && addon.addon_id != null) {
    ownerId = await Addon.findOwnerId(ownerId, addon.addon_id);
  }
  if (ownerId == null && addon.addon_name != null) {
    const foundAddon = await Addon.findByName(addon.addon_name);
    ownerId = foundAddon.orgaId;
  }

  await Addon.deleteAddon(ownerId, addon, skipConfirmation);

  Logger.println(`Addon ${addon.addon_id || addon.addon_name} successfully deleted`);
}

export async function rename(params) {
  const [addon, newName] = params.args;
  const { org: orgaIdOrName } = params.options;

  const ownerId = await Organisation.getId(orgaIdOrName);
  await Addon.rename(ownerId, addon, newName);

  Logger.println(`Addon ${addon.addon_id || addon.addon_name} successfully renamed to ${newName}`);
}

export async function listProviders(params) {
  const { format } = params.options;

  const providers = await Addon.listProviders();

  switch (format) {
    case 'json': {
      const formattedProviders = providers.map((provider) => ({
        id: provider.id,
        name: provider.name,
        shortDesc: provider.shortDesc,
        regions: provider.regions,
        plans: provider.plans.map((plan) => ({
          id: plan.id,
          name: plan.name,
          slug: plan.slug,
        })),
      }));
      Logger.printJson(formattedProviders);
      break;
    }
    case 'human':
    default: {
      const formattedProviders = providers.map((provider) => {
        return [styleText('bold', provider.id), provider.name, provider.shortDesc || ''];
      });
      Logger.println(formatTable(formattedProviders));
    }
  }
}

export async function showProvider(params) {
  const [providerName] = params.args;
  const { format } = params.options;

  const provider = await Addon.getProvider(providerName);
  const providerInfos = await Addon.getProviderInfos(providerName);

  const formattedPlans = [...provider.plans]
    .sort((a, b) => a.price - b.price)
    .map((plan) => {
      const formattedFeatures = plan.features
        .map((feature) => ({
          name: feature.name,
          value: feature.value,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      const formattedPlan = {
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        features: formattedFeatures,
      };

      if (providerInfos != null) {
        const planType = plan.features.find(({ name }) => name.toLowerCase() === 'type');
        if (planType != null && planType.value.toLowerCase() === 'dedicated') {
          const planVersions = Object.keys(providerInfos.dedicated);
          formattedPlan.versions = planVersions.map((version) => {
            return {
              version,
              isDefault: version === providerInfos.defaultDedicatedVersion,
              features: providerInfos.dedicated[version].features.map((feature) => ({
                name: feature.name,
                enabledByDefault: feature.enabled,
              })),
            };
          });
        }
      }

      return formattedPlan;
    });

  const formattedProvider = {
    id: provider.id,
    name: provider.name,
    shortDesc: provider.shortDesc,
    regions: provider.regions,
    plans: formattedPlans,
  };

  switch (format) {
    case 'json': {
      Logger.printJson(formattedProvider);
      break;
    }
    case 'human':
    default: {
      Logger.println(styleText('bold', formattedProvider.id));
      Logger.println(`${formattedProvider.name}: ${formattedProvider.shortDesc}`);
      Logger.println();
      Logger.println(`Available regions: ${formattedProvider.regions.join(', ')}`);
      Logger.println();
      Logger.println('Available plans');

      formattedProvider.plans.forEach((plan) => {
        Logger.println(`Plan ${styleText('bold', plan.slug)}`);
        plan.features.forEach(({ name, value }) => Logger.println(`  ${name}: ${value}`));

        if (plan.versions != null) {
          Logger.println(
            `  Available versions: ${plan.versions.map(({ version, isDefault }) => (isDefault ? `${version} (default)` : version)).join(', ')}`,
          );
          plan.versions.forEach(({ version, features }) => {
            Logger.println(`  Options for version ${version}:`);
            features.forEach(({ name, enabledByDefault }) => {
              Logger.println(`    ${name}: default=${enabledByDefault}`);
            });
          });
        }
      });
    }
  }
}

export async function env(params) {
  const { org, format } = params.options;
  const [addonIdOrRealId] = params.args;

  const addonId = await resolveAddonId(addonIdOrRealId);
  const ownerId = await findOwnerId(org, addonId);

  const envFromAddon = await getAllEnvVars({ id: ownerId, addonId }).then(sendToApi);

  switch (format) {
    case 'json': {
      const envFromAddonJson = Object.fromEntries(envFromAddon.map(({ name, value }) => [name, value]));
      Logger.println(JSON.stringify(envFromAddonJson, null, 2));
      break;
    }

    case 'shell':
      Logger.println(toNameEqualsValueString(envFromAddon, { addExports: true }));
      break;

    case 'human':
    default:
      Logger.println(toNameEqualsValueString(envFromAddon, { addExports: false }));
  }
}
