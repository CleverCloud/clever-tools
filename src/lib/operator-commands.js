import { CheckKeycloakVersionCommand } from '@clevercloud/client/cc-api-commands/keycloak/check-keycloak-version-command.js';
import { CreateKeycloakNetworkGroupCommand } from '@clevercloud/client/cc-api-commands/keycloak/create-keycloak-network-group-command.js';
import { DeleteKeycloakNetworkGroupCommand } from '@clevercloud/client/cc-api-commands/keycloak/delete-keycloak-network-group-command.js';
import { RebootKeycloakCommand } from '@clevercloud/client/cc-api-commands/keycloak/reboot-keycloak-command.js';
import { RebuildKeycloakCommand } from '@clevercloud/client/cc-api-commands/keycloak/rebuild-keycloak-command.js';
import { UpdateKeycloakVersionCommand } from '@clevercloud/client/cc-api-commands/keycloak/update-keycloak-version-command.js';
import { RebootMatomoCommand } from '@clevercloud/client/cc-api-commands/matomo/reboot-matomo-command.js';
import { RebuildMatomoCommand } from '@clevercloud/client/cc-api-commands/matomo/rebuild-matomo-command.js';
import { CheckMetabaseVersionCommand } from '@clevercloud/client/cc-api-commands/metabase/check-metabase-version-command.js';
import { RebootMetabaseCommand } from '@clevercloud/client/cc-api-commands/metabase/reboot-metabase-command.js';
import { RebuildMetabaseCommand } from '@clevercloud/client/cc-api-commands/metabase/rebuild-metabase-command.js';
import { UpdateMetabaseVersionCommand } from '@clevercloud/client/cc-api-commands/metabase/update-metabase-version-command.js';
import { CheckOtoroshiVersionCommand } from '@clevercloud/client/cc-api-commands/otoroshi/check-otoroshi-version-command.js';
import { CreateOtoroshiNetworkGroupCommand } from '@clevercloud/client/cc-api-commands/otoroshi/create-otoroshi-network-group-command.js';
import { DeleteOtoroshiNetworkGroupCommand } from '@clevercloud/client/cc-api-commands/otoroshi/delete-otoroshi-network-group-command.js';
import { GetOtoroshiConfigCommand } from '@clevercloud/client/cc-api-commands/otoroshi/get-otoroshi-config-command.js';
import { RebootOtoroshiCommand } from '@clevercloud/client/cc-api-commands/otoroshi/reboot-otoroshi-command.js';
import { RebuildOtoroshiCommand } from '@clevercloud/client/cc-api-commands/otoroshi/rebuild-otoroshi-command.js';
import { UpdateOtoroshiVersionCommand } from '@clevercloud/client/cc-api-commands/otoroshi/update-otoroshi-version-command.js';
import dedent from 'dedent';
import _ from 'lodash';
import { config } from '../config/config.js';
import { toLegacyOperator, toLegacyOperatorVersionCheck } from '../legacy-json/operator.legacy.js';
import { Logger } from '../logger.js';
import { clients } from '../models/cc-api-client.js';
import { findAddonsByAddonProvider } from '../models/ids-resolver.js';
import * as Operator from '../models/operator.js';
import { openBrowser } from '../models/utils.js';
import { printItemsByOwner } from './print-items-by-owner.js';
import { confirm, selectAnswer } from './prompts.js';
import { styleText } from './style-text.js';

const OPERATOR_COMMANDS = {
  keycloak: {
    checkVersion: CheckKeycloakVersionCommand,
    updateVersion: UpdateKeycloakVersionCommand,
    reboot: RebootKeycloakCommand,
    rebuild: RebuildKeycloakCommand,
    enableNetworkGroup: CreateKeycloakNetworkGroupCommand,
    disableNetworkGroup: DeleteKeycloakNetworkGroupCommand,
  },
  matomo: {
    reboot: RebootMatomoCommand,
    rebuild: RebuildMatomoCommand,
  },
  metabase: {
    checkVersion: CheckMetabaseVersionCommand,
    updateVersion: UpdateMetabaseVersionCommand,
    reboot: RebootMetabaseCommand,
    rebuild: RebuildMetabaseCommand,
  },
  otoroshi: {
    checkVersion: CheckOtoroshiVersionCommand,
    updateVersion: UpdateOtoroshiVersionCommand,
    reboot: RebootOtoroshiCommand,
    rebuild: RebuildOtoroshiCommand,
    enableNetworkGroup: CreateOtoroshiNetworkGroupCommand,
    disableNetworkGroup: DeleteOtoroshiNetworkGroupCommand,
  },
};

/**
 * Get the command class of an operator action for a given provider
 * @param {string} provider The operator's provider
 * @param {string} action The action to perform
 * @returns {new (params: object) => object} The command class
 * @throws {Error} If the provider doesn't support the action
 */
function getOperatorCommandClass(provider, action) {
  const CommandClass = OPERATOR_COMMANDS[provider]?.[action];
  if (CommandClass == null) {
    throw new Error(`Unsupported action "${action}" for provider ${styleText('red', provider)}`);
  }
  return CommandClass;
}

/**
 * Check the version of an operator
 * @param {string} provider The operator's provider
 * @param {{ addon_name?: string, operator_id?: string, addon_id?: string }} addonIdOrName The operator's name or ID
 * @param {string} params.options.format The output format
 * @returns {Promise<void>}
 */
export async function operatorCheckVersion(provider, addonIdOrName, format) {
  const realId = await Operator.getSingleRealId(addonIdOrName);
  const name = getDisplayName(addonIdOrName);
  const CheckVersionCommand = getOperatorCommandClass(provider, 'checkVersion');
  const versions = await clients.ccApi.send(new CheckVersionCommand({ addonId: realId }));

  switch (format) {
    case 'json':
      // `--format json` still prints the raw payload, see src/legacy-json/README.md
      Logger.printJson(toLegacyOperatorVersionCheck(versions));
      break;
    case 'human':
    default:
      if (!versions.needUpdate || (provider === 'metabase' && versions.installed === 'community-latest')) {
        Logger.printSuccess(`${styleText('green', name)} is up-to-date (${styleText('green', versions.installed)})`);
      } else {
        Logger.println(dedent`
          🔄 ${styleText('red', name)} is outdated
             • Installed version: ${styleText('red', versions.installed)}
             • Latest version: ${styleText('green', versions.latest)}
        `);
        Logger.println();

        await confirm(
          `Do you want to update it to ${styleText('green', versions.latest)} now?`,
          'No confirmation, aborting version update',
        );

        const UpdateVersionCommand = getOperatorCommandClass(provider, 'updateVersion');
        await clients.ccApi.send(new UpdateVersionCommand({ addonId: realId, targetVersion: versions.latest }));
        Logger.printSuccess(`${styleText('green', name)} is up-to-date and being rebuilt…`);
      }
      break;
  }
}

/**
 * Update the version of an operator
 * @param {string} provider The operator's provider
 * @param {string} askedVersion The version to update to
 * @param {{ addon_name?: string, operator_id?: string, addon_id?: string }} addonIdOrName The operator's name or ID
 * @returns {Promise<void>}
 */
export async function operatorUpdateVersion(provider, askedVersion, addonIdOrName) {
  const realId = await Operator.getSingleRealId(addonIdOrName);
  const name = getDisplayName(addonIdOrName);

  const CheckVersionCommand = getOperatorCommandClass(provider, 'checkVersion');
  const versions = await clients.ccApi.send(new CheckVersionCommand({ addonId: realId }));

  const targetVersion =
    askedVersion ??
    (await selectAnswer(
      `Which version do you want to update ${styleText('blue', name)} to, current is ${styleText('blue', versions.installed)}?`,
      versions.availableVersions.reverse(),
      'Use --target <version> to update directly.',
    ));

  if (!versions.availableVersions.includes(targetVersion)) {
    throw new Error(`Version ${styleText('red', targetVersion)} is not available`);
  }

  if (versions.installed === targetVersion) {
    Logger.printSuccess(`${styleText('green', name)} is already at version ${styleText('green', targetVersion)}`);
    return;
  }

  const UpdateVersionCommand = getOperatorCommandClass(provider, 'updateVersion');
  await clients.ccApi.send(new UpdateVersionCommand({ addonId: realId, targetVersion }));
  Logger.printSuccess(`${styleText('green', name)} updated to ${styleText('green', targetVersion)} and being rebuilt…`);
}

/**
 * Unlink an operator from a Network Group
 * @param {string} provider The operator's provider
 * @param {{ addon_name?: string, operator_id?: string, addon_id?: string }} addonIdOrName The operator's name or ID
 * @returns {Promise<void>}
 * @throws {Error} If the Network Group feature is already disabled
 */
export async function operatorNgDisable(provider, addonIdOrName) {
  const name = getDisplayName(addonIdOrName);
  const operator = await Operator.getDetails(provider, addonIdOrName);
  if (!operator.features.networkGroup?.id) {
    throw new Error(`Network Group is already disabled on ${styleText('red', name)}`);
  }

  const DisableNetworkGroupCommand = getOperatorCommandClass(provider, 'disableNetworkGroup');
  await clients.ccApi.send(new DisableNetworkGroupCommand({ addonId: operator.id }));
  Logger.println(`Disabling Network Group on ${styleText('blue', name)}…`);

  await operatorPrint(provider, addonIdOrName);
}

/**
 * Link an operator to a Network Group
 * @param {string} provider The operator's provider
 * @param {{ addon_name?: string, operator_id?: string, addon_id?: string }} addonIdOrName The operator's name or ID
 * @returns {Promise<void>}
 * @throws {Error} If the Network Group feature is already enabled
 */
export async function operatorNgEnable(provider, addonIdOrName) {
  const name = getDisplayName(addonIdOrName);
  const operator = await Operator.getDetails(provider, addonIdOrName);

  if (operator.features.networkGroup?.id) {
    throw new Error(`Network Group is already enabled on ${styleText('red', name)}`);
  }

  const EnableNetworkGroupCommand = getOperatorCommandClass(provider, 'enableNetworkGroup');
  await clients.ccApi.send(new EnableNetworkGroupCommand({ addonId: operator.id }));
  Logger.println(`Enabling Network Group on ${styleText('blue', name)}…`);

  await operatorPrint(provider, addonIdOrName);
}

/**
 * List all operators for a given provider
 * @param {string} provider The operator's provider
 * @param {string} format The output format
 * @returns {Promise<void>}
 */
export async function operatorList(provider, format) {
  const deployed = await findAddonsByAddonProvider(provider);
  const providerName = _.capitalize(provider.replace('addon-', ''));
  switch (format) {
    case 'json': {
      const operatorsPerOwner = Object.groupBy(deployed, (o) => o.ownerId);
      Logger.printJson(operatorsPerOwner);
      break;
    }
    case 'human':
    default:
      printItemsByOwner(deployed, {
        itemName: `${providerName} operator`,
        emptyCommand: `clever addon create ${providerName.toLocaleLowerCase()}`,
        getItemId: (o) => o.realId,
      });
      break;
  }
}

/**
 * Open an operator dashboard in the Clever Cloud Console in the browser
 * @param {string} provider The operator's provider
 * @param {{ addon_name?: string, operator_id?: string, addon_id?: string }} addonIdOrName The operator's name or ID
 * @returns {Promise<void>}
 */
export async function operatorOpen(provider, addonIdOrName) {
  const operator = await Operator.getDetails(provider, addonIdOrName);
  await openBrowser(
    `${config.GOTO_URL}/${operator.addonId}`,
    `Opening ${styleText('blue', operator.addonId)} in the browser…`,
  );
}

/**
 * Open the Logs section of an operator application in the Clever Cloud Console
 * @param {string} provider The operator's provider
 * @param {{ addon_name?: string, operator_id?: string, addon_id?: string }} addonIdOrName The operator's name or ID
 * @returns {Promise<void>}
 */
export async function operatorOpenLogs(provider, addonIdOrName) {
  const operator = await Operator.getDetails(provider, addonIdOrName);
  await openBrowser(
    `/organisations/${operator.ownerId}/applications/${operator.resources.entrypoint}/logs`,
    `Opening ${styleText('blue', operator.addonId)} logs in the browser…`,
  );
}

/**
 * Open an operator Web UI in the browser
 * @param {string} provider The operator's provider
 * @param {{ addon_name?: string, operator_id?: string, addon_id?: string }} addonIdOrName The operator's name or ID
 * @returns {Promise<void>}
 */
export async function operatorOpenWebUi(provider, addonIdOrName) {
  const operator = await Operator.getDetails(provider, addonIdOrName);
  await openBrowser(operator.accessUrl, `Opening ${styleText('blue', operator.addonId)} web UI in the browser…`);
}

/**
 * Open an Otoroshi Swagger UI in the browser
 * @param {{ addon_name?: string, operator_id?: string, addon_id?: string }} addonIdOrName The operator's name or ID
 * @returns {Promise<void>}
 */
export async function operatorOpenSwaggerUi(addonIdOrName) {
  const operator = await Operator.getDetails('otoroshi', addonIdOrName);
  await openBrowser(
    operator.api.swaggerUrl,
    `Opening ${styleText('blue', operator.addonId)} Swagger UI in the browser…`,
  );
}

/**
 * Reboot an operator
 * @param {object} params The command's parameters
 * @param {string} provider The operator's provider
 * @param {{ addon_name?: string, operator_id?: string, addon_id?: string }} addonIdOrName The operator's name or ID
 * @returns {Promise<void>}
 */
export async function operatorReboot(provider, addonIdOrName) {
  const name = getDisplayName(addonIdOrName);
  const realId = await Operator.getSingleRealId(addonIdOrName);
  const RebootCommand = getOperatorCommandClass(provider, 'reboot');
  await clients.ccApi.send(new RebootCommand({ addonId: realId }));
  Logger.println(`🔄 Restarting ${styleText('blue', name)}…`);
}

/**
 * Rebuild an operator
 * @param {object} params The command's parameters
 * @param {string} provider The operator's provider
 * @param {{ addon_name?: string, operator_id?: string, addon_id?: string }} addonIdOrName The operator's name or ID
 * @returns {Promise<void>}
 */
export async function operatorRebuild(provider, addonIdOrName) {
  const name = getDisplayName(addonIdOrName);
  const realId = await Operator.getSingleRealId(addonIdOrName);
  const RebuildCommand = getOperatorCommandClass(provider, 'rebuild');
  await clients.ccApi.send(new RebuildCommand({ addonId: realId }));
  Logger.println(`🔄 Rebuilding ${styleText('blue', name)}…`);
}

/**
 * Print the details of an operator
 * @param {string} provider The operator's provider
 * @param {{ addon_name?: string, operator_id?: string, addon_id?: string }} addonIdOrName The operator's name or ID
 * @param {string} format The output format
 * @returns {void}
 */
export async function operatorPrint(provider, addonIdOrName, format = 'human') {
  const operator = await Operator.getDetails(provider, addonIdOrName);

  if (provider === 'otoroshi' && format === 'otoroshictl') {
    const otoroshiConfig = await clients.ccApi.send(new GetOtoroshiConfigCommand({ addonId: operator.id }));

    Logger.println(otoroshiConfig);
    return;
  }

  const dataToPrint = {
    Name: operator.name,
    ID: operator.id,
    Owner: operator.ownerId,
  };

  dataToPrint.Version =
    provider === 'matomo'
      ? `${operator.version} (PHP ${operator.phpVersion})`
      : `${operator.version} (Java ${operator.javaVersion})`;

  dataToPrint['Access URL'] = operator.accessUrl;

  if (provider === 'otoroshi') {
    dataToPrint['Swagger URL'] = operator.api.swaggerUrl;
    dataToPrint['API endpoint'] = operator.api.url;
  }

  if (['otoroshi', 'keycloak'].includes(provider)) {
    dataToPrint['Network Group'] = operator.features.networkGroup?.id ?? false;
  }

  switch (format) {
    case 'json':
      // `--format json` still prints the raw payload, see src/legacy-json/README.md
      Logger.printJson(toLegacyOperator(provider, operator));
      break;
    case 'human':
    default:
      console.table(dataToPrint);
      break;
  }
}

function getDisplayName(addonIdOrName) {
  return addonIdOrName.addon_name ?? addonIdOrName.operator_id ?? addonIdOrName.addon_id;
}
