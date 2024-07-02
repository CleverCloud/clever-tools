'use strict';

const colors = require('colors/safe');

const Addon = require('../models/addon.js');
const AppConfig = require('../models/app_configuration.js');
const formatTable = require('../format-table')();
const Logger = require('../logger.js');
const Organisation = require('../models/organisation.js');
const User = require('../models/user.js');
const { parseAddonOptions, findOwnerId } = require('../models/addon.js');
const { getAllEnvVars } = require('@clevercloud/client/cjs/api/v2/addon.js');
const { sendToApi } = require('../models/send-to-api.js');
const { toNameEqualsValueString } = require('@clevercloud/client/cjs/utils/env-vars.js');
const { resolveAddonId } = require('../models/ids-resolver.js');

async function list (params) {
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
          colors.bold.green(addon.name),
          addon.id,
        ];
      });
      Logger.println(formatTable(formattedAddons));
    }
  }
}

async function create (params) {
  const [providerName, name] = params.args;
  const {
    link: linkedAppAlias,
    plan: planName,
    region,
    yes: skipConfirmation,
    org: orgaIdOrName,
    format,
  } = params.options;
  const version = params.options['addon-version'];
  const addonOptions = parseAddonOptions(params.options.option);

  const ownerId = (orgaIdOrName != null)
    ? await Organisation.getId(orgaIdOrName)
    : await User.getCurrentId();

  const addonToCreate = {
    ownerId,
    name,
    providerName,
    planName,
    region,
    skipConfirmation,
    version,
    addonOptions,
  };

  if (linkedAppAlias != null) {
    const linkedAppData = await AppConfig.getAppDetails({ alias: linkedAppAlias });
    if (orgaIdOrName != null && linkedAppData.ownerId !== ownerId && format === 'human') {
      Logger.warn('The specified application does not belong to the specified organisation. Ignoring the `--org` option');
    }
    const newAddon = await Addon.create({
      ...addonToCreate,
      ownerId: linkedAppData.ownerId,
    });
    await Addon.link(linkedAppData.ownerId, linkedAppData.appId, { addon_id: newAddon.id });
    displayAddon(format, newAddon, providerName, `Add-on created and linked to application ${linkedAppAlias} successfully!`);
  }
  else {
    const newAddon = await Addon.create(addonToCreate);
    displayAddon(format, newAddon, providerName, 'Add-on created successfully!');
  }
}

function displayAddon (format, addon, providerName, message) {

  const WIP_PROVIDERS = {
    keycloak: {
      status: 'alpha',
      postCreateInstructions: [
        'Learn more about Keycloak on Clever Cloud: https://developers.clever-cloud.com/doc/addons/keycloak/',
      ].join('\n'),
    },
    kv: {
      status: 'alpha',
      postCreateInstructions: [
        colors.yellow('You can easily use Materia KV with \'redis-cli\', with such commands:'),
        colors.blue(`source <(clever addon env ${addon.id} -F shell)`),
        colors.blue('redis-cli -h $KV_HOST -p $KV_PORT --tls'),
        'Learn more about Materia KV on Clever Cloud: https://developers.clever-cloud.com/doc/addons/materia-kv/',
      ].join('\n'),
    },
    'addon-pulsar': {
      status: 'beta',
      postCreateInstructions: [
        'Learn more about Pulsar on Clever Cloud: https://developers.clever-cloud.com/doc/addons/pulsar/',
      ].join('\n'),
    },
  };

  let providerNameToShow = '';
  let statusMessage = '';
  if (providerName in WIP_PROVIDERS) {

    providerNameToShow = providerName === 'kv'
      ? 'Materia KV'
      : providerName;

    statusMessage = `The ${providerNameToShow} provider is in ${WIP_PROVIDERS[providerName].status} testing phase`;
    statusMessage += WIP_PROVIDERS[providerName].status === 'alpha'
      ? '. Don\'t store sensitive or production grade data.'
      : '';
  }

  switch (format) {

    case 'json': {
      const jsonAddon = {
        id: addon.id,
        realId: addon.realId,
        name: addon.name,
      };

      Logger.printJson((WIP_PROVIDERS[providerName] != null)
        ? { ...jsonAddon, availability: WIP_PROVIDERS[providerName].status, message: statusMessage }
        : jsonAddon);
      break;
    }

    case 'human':
    default:
      Logger.println([
        message,
        `ID: ${addon.id}`,
        `Real ID: ${addon.realId}`,
        `Name: ${addon.name}`,
      ].join('\n'));

      if (providerName in WIP_PROVIDERS) {

        Logger.println();
        Logger.println(colors.yellow(`/!\\ ${statusMessage}`));
        Logger.println(WIP_PROVIDERS[providerName].postCreateInstructions);
      }
  }
}

async function deleteAddon (params) {
  const { yes: skipConfirmation, org: orgaIdOrName } = params.options;
  const [addon] = params.args;

  const ownerId = await Organisation.getId(orgaIdOrName);
  await Addon.delete(ownerId, addon, skipConfirmation);

  Logger.println(`Addon ${addon.addon_id || addon.addon_name} successfully deleted`);
}

async function rename (params) {
  const [addon, newName] = params.args;
  const { org: orgaIdOrName } = params.options;

  const ownerId = await Organisation.getId(orgaIdOrName);
  await Addon.rename(ownerId, addon, newName);

  Logger.println(`Addon ${addon.addon_id || addon.addon_name} successfully renamed to ${newName}`);
}

async function listProviders (params) {
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
        return [
          colors.bold(provider.id),
          provider.name,
          provider.shortDesc || '',
        ];
      });
      Logger.println(formatTable(formattedProviders));
    }
  }
}

async function showProvider (params) {
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
              options: providerInfos.dedicated[version].features.map((feature) => ({
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
      Logger.println(colors.bold(formattedProvider.id));
      Logger.println(`${formattedProvider.name}: ${formattedProvider.shortDesc}`);
      Logger.println();
      Logger.println(`Available regions: ${formattedProvider.regions.join(', ')}`);
      Logger.println();
      Logger.println('Available plans');

      formattedProvider.plans.forEach((plan) => {
        Logger.println(`Plan ${colors.bold(plan.slug)}`);
        plan.features.forEach(({ name, value }) => Logger.println(`  ${name}: ${value}`));

        if (plan.versions != null) {
          Logger.println(`  Available versions: ${plan.versions.map(({ version, isDefault }) => isDefault ? `${version} (default)` : version).join(', ')}`);
          plan.versions.forEach(({ version, options }) => {
            Logger.println(`  Options for version ${version}:`);
            options.forEach(({ name, enabledByDefault }) => {
              Logger.println(`    ${name}: default=${enabledByDefault}`);
            });
          });
        }
      });
    }
  }
}

async function env (params) {

  const { org, format } = params.options;
  const [addonIdOrRealId] = params.args;

  const addonId = await resolveAddonId(addonIdOrRealId);
  const ownerId = await findOwnerId(org, addonId);

  const envFromAddon = await getAllEnvVars({ id: ownerId, addonId }).then(sendToApi);

  switch (format) {

    case 'json': {
      const envFromAddonJson = Object.fromEntries(
        envFromAddon.map(({ name, value }) => [name, value]),
      );
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

module.exports = {
  list,
  create,
  delete: deleteAddon,
  rename,
  listProviders,
  showProvider,
  env,
};
