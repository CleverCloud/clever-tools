import dedent from 'dedent';
import { getOperator } from '../../clever-client/operators.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Addon from '../../models/addon.js';
import { completePlan, completeRegion, parseAddonOptions } from '../../models/addon.js';
import * as AppConfig from '../../models/app_configuration.js';
import { listAvailableAliases } from '../../models/application.js';
import { conf } from '../../models/configuration.js';
import * as Organisation from '../../models/organisation.js';
import { sendToApi } from '../../models/send-to-api.js';
import * as User from '../../models/user.js';
import { addonOptions as addonOptionsParser } from '../../parsers.js';
import { colorOpt, humanJsonOutputFormatOpt, orgaIdOrNameOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';
import { addonNameArg, addonProviderArg } from './addon.args.js';

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

export const addonCreateCommand = defineCommand({
  name: 'create',
  description: 'Create an add-on',
  experimental: false,
  featureFlag: null,
  opts: {
    link: defineOption({
      name: 'link',
      description: 'Link the created add-on to the app with the specified alias',
      type: 'option',
      metavar: 'alias',
      aliases: ['l'],
      default: null,
      required: null,
      parser: null,
      complete: listAvailableAliases,
    }),
    yes: defineOption({
      name: 'yes',
      description: 'Skip confirmation even if the add-on is not free',
      type: 'flag',
      metavar: null,
      aliases: ['y'],
      default: null,
      required: null,
      parser: null,
      complete: null,
    }),
    plan: defineOption({
      name: 'plan',
      description: 'Add-on plan, depends on the provider',
      type: 'option',
      metavar: 'plan',
      aliases: ['p'],
      default: '',
      required: null,
      parser: null,
      complete: completePlan,
    }),
    region: defineOption({
      name: 'region',
      description: 'Region to provision the add-on in, depends on the provider',
      type: 'option',
      metavar: 'region',
      aliases: ['r'],
      default: 'par',
      required: null,
      parser: null,
      complete: completeRegion,
    }),
    'addon-version': defineOption({
      name: 'addon-version',
      description: 'The version to use for the add-on',
      type: 'option',
      metavar: 'addon-version',
      aliases: null,
      default: null,
      required: null,
      parser: null,
      complete: null,
    }),
    option: defineOption({
      name: 'option',
      description:
        'Option to enable for the add-on. Multiple --option argument can be passed to enable multiple options',
      type: 'option',
      metavar: 'option',
      aliases: null,
      default: null,
      required: null,
      parser: addonOptionsParser,
      complete: null,
    }),
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    org: orgaIdOrNameOpt,
    format: humanJsonOutputFormatOpt,
  },
  args: [addonProviderArg, addonNameArg],
  async execute(params) {
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
          Logger.println(
            "An initial account has been created, you'll be invited to change the password at first login:",
          );
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
  },
});
