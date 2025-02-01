import { getAll as getAllAddons } from '@clevercloud/client/esm/api/v2/addon.js';
import * as application from '@clevercloud/client/esm/api/v2/application.js';
import { validateName } from '@clevercloud/client/esm/utils/env-vars.js';
import { sendToApi } from './send-to-api.js';
import { findAddonsByNameOrId } from './ids-resolver.js';
import colors from 'colors/safe.js';
import { getOperator, rebootOperator, rebuildOperator } from './operators-api.js';

const KC_VERSIONS = [
  '26.0.8',
  '26.1.0',
];

const METABASE_VERSIONS = [
  'community-latest',
  'v0.51',
  'v0.51.12',
  'v0.52',
  'v0.52.8',
];

const OTOROSHI_VERSIONS = [
  'v16.22.0_1737449369',
  'v16.22.0_1737793936',
  'v16.22.0_1738182959',
  'v16.23.0_1738251867',
  'v16.23.1_1738331619',
];

/** Get the version information of an operator
 * @param {string} provider The operator's provider
 * @param {object|string} operatorIdOrName The operator's ID or name
 * @returns {Promise<object>} The version information
 */
export async function checkVersion (provider, operatorIdOrName) {

  const operator = await getWithEnv(provider, operatorIdOrName);

  let available = [];
  let installed = '';
  switch (provider) {
    case 'keycloak':
      installed = operator.env.find((env) => env.name === 'CC_KEYCLOAK_VERSION').value;
      available = KC_VERSIONS;
      break;
    case 'metabase':
      installed = operator.env.find((env) => env.name === 'CC_METABASE_VERSION').value;
      available = METABASE_VERSIONS;
      break;
    case 'otoroshi': {
      const otoVersion = operator.env.find((env) => env.name === 'CC_OTOROSHI_VERSION').value;
      const apimVersion = operator.env.find((env) => env.name === 'CC_OTOROSHI_APIM_VERSION').value;
      installed = `${otoVersion}_${apimVersion}`;
      available = OTOROSHI_VERSIONS;
      break;
    }
  }

  return {
    installed,
    available,
    latest: available[available.length - 1],
    needUpdate: available[available.length - 1] !== installed,
  };
}

/**
 * Get the details of an operator from its name or ID
 * @param {string} provider The operator's provider
 * @param {object|string} operatorIdOrName The operator's ID or name
 * @returns {Promise<object>} The operator's details
 * @throws {Error} If the operator provider is unknown
 */
export async function getDetails (provider, operatorIdOrName) {
  const realId = await getSingleRealId(operatorIdOrName);
  return getOperator({ provider, realId }).then(sendToApi);
}

/**
 * Get the real ID of an operator from its name or ID
 * @param {object|string} operatorIdOrName The operator's ID or name
 * @returns {Promise<string>} The operator's real ID
 * @throws {Error} If the operator is not found
 * @throws {Error} If the operator name is ambiguous
 */
export async function getSingleRealId (operatorIdOrName) {

  let operatorId = operatorIdOrName.operator_id;

  if (!operatorId) {
    const otoroshi = await findAddonsByNameOrId(operatorIdOrName.addon_name || operatorIdOrName.addon_id || operatorIdOrName);

    if (otoroshi.length === 0) {
      throw new Error(`Could not find ${colors.red(operatorIdOrName.addon_name)} operator`);
    }

    if (otoroshi.length > 1) {
      throw new Error(`Ambiguous operator name ${colors.red(operatorIdOrName.addon_name)}, use the real ID instead:
${colors.grey(otoroshi.map((otoroshi) => `- ${otoroshi.name} (${otoroshi.realId})`).join('\n'))}`);
    }

    operatorId = otoroshi[0].realId;
  }

  return operatorId;
}

/** Get the details of an operator from its name or ID, with its environment variables
 * @param {string} provider The operator's provider
 * @param {object|string} operatorIdOrName The operator's ID or name
 * @returns {Promise<object>} The operator's details with its environment variables
 * @throws {Error} If the operator provider is unknown
 */
export async function getWithEnv (provider, operatorIdOrName) {
  const operator = await getDetails(provider, operatorIdOrName);

  switch (provider) {
    case 'keycloak':
      operator.appId = operator.applications[0].javaId;
      break;
    case 'metabase':
    case 'otoroshi':
      operator.appId = operator.javaId;
      break;
    default:
      throw new Error(`Unknown provider ${provider}`);
  }

  operator.env = await application.getAllEnvVars({ id: operator.ownerId, appId: operator.appId }).then(sendToApi);
  return operator;
}

/** List all deployed operators for a given provider
 * @param {string} provider The operator's provider
 * @param {string} ownerId The owner's ID
 * @returns {Promise<object[]>} The list of deployed operators
*/
export async function listDeployed (provider, ownerId) {
  const addons = await getAllAddons({ id: ownerId }).then(sendToApi);
  const operators = addons.filter((addon) => addon.provider.id === provider);

  return operators;
}

/** Reboot an operator
 * @param {string} provider The operator's provider
 * @param {object|string} operatorIdOrName The operator's ID or name
 * @returns {Promise<void>}
 */
export async function reboot (provider, operatorIdOrName) {
  const realId = await getSingleRealId(operatorIdOrName);
  await rebootOperator({ provider, realId }).then(sendToApi);
}

/** Rebuild an operator
 * @param {string} provider The operator's provider
 * @param {object|string} operatorIdOrName The operator's ID or name
 * @returns {Promise<void>}
 */
export async function rebuild (provider, operatorIdOrName) {
  const realId = await getSingleRealId(operatorIdOrName);
  await rebuildOperator({ provider, realId }).then(sendToApi);
}

/** Set an environment variable for an given application
 * @param {string} ownerId The owner's ID
 * @param {string} appId The application's ID
 * @param {string} envName The environment variable's name
 * @param {string} value The environment variable's value
 * @returns {Promise<void>}
 * @throws {Error} If the environment variable name is invalid
 */
export async function setEnvVar (ownerId, appId, envName, value) {

  const nameIsValid = validateName(envName);

  if (!nameIsValid) {
    throw new Error(`Environment variable name ${envName} is invalid`);
  }

  await application.updateEnvVar({ id: ownerId, appId, envName }, { value }).then(sendToApi);
}

/** Update an operator to a specific version
 * @param {string} provider The operator's provider
 * @param {object|string} operatorIdOrName The operator's ID or name
 * @param {string} version The version to update to
 * @returns {Promise<void>}
 * @throws {Error} If the version is not supported
 */
export async function updateVersion (provider, operatorIdOrName, version) {
  const operator = await getWithEnv(provider, operatorIdOrName);

  switch (provider) {
    case 'keycloak':
      if (!KC_VERSIONS.includes(version)) {
        throw new Error(`Version ${colors.red(version)} is not supported.`);
      }

      await setEnvVar(operator.ownerId, operator.appId, 'CC_KEYCLOAK_VERSION', version);
      break;
    case 'metabase':
      if (!METABASE_VERSIONS.includes(version)) {
        throw new Error(`Version ${colors.red(version)} is not supported.`);
      }

      await setEnvVar(operator.ownerId, operator.appId, 'CC_METABASE_VERSION', version);
      break;
    case 'otoroshi': {
      if (!OTOROSHI_VERSIONS.includes(version)) {
        throw new Error(`Version ${colors.red(version)} is not supported.`);
      }

      const newVersion = { version: version.split('_')[0], llm_version: version.split('_')[1] };
      await setEnvVar(operator.ownerId, operator.javaId, 'CC_OTOROSHI_VERSION', `${newVersion.version}`);
      await setEnvVar(operator.ownerId, operator.javaId, 'CC_OTOROSHI_APIM_VERSION', newVersion.llm_version);
      break;
    }
    default:
      throw new Error(`Unknown provider: ${colors.red(provider)}`);
  }

  await rebuild(provider, operatorIdOrName);
}
