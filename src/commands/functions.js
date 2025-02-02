import fs from 'node:fs';
import colors from 'colors/safe.js';

import * as User from '../models/user.js';
import * as Organisation from '../models/organisation.js';

import { Logger } from '../logger.js';
import { setTimeout } from 'timers/promises';
import { sendToApi } from '../models/send-to-api.js';
import { uploadFunction } from '../models/functions.js';
import { createFunction, createDeployment, getDeployments, getDeployment, getFunctions, deleteDeployment, triggerDeployment, deleteFunction } from '../models/functions-api.js';

const DEFAULT_MAX_INSTANCES = 1;
const DEFAULT_MAX_MEMORY = 64 * 1024 * 1024;

const PLATFORMS = {
  ts: 'ASSEMBLY_SCRIPT',
  js: 'JAVA_SCRIPT',
  rs: 'RUST',
  go: 'TINY_GO',
};

/**
 * Creates a new function
 * @param {Object} params
 * @param {Object} params.options
 * @param {Object} params.options.org - The organisation to create the function in
 * @returns {Promise<void>}
 * */
export async function create (params) {
  const { org } = params.options;

  const ownerId = (org != null && org.orga_name !== '')
    ? await Organisation.getId(org)
    : (await User.getCurrent()).id;

  const createdFunction = await createFunction({ ownerId }, {
    name: null,
    description: null,
    environment: {},
    tag: null,
    maxInstances: DEFAULT_MAX_INSTANCES,
    maxMemory: DEFAULT_MAX_MEMORY,
  }).then(sendToApi);

  Logger.println(`${colors.green('✓')} Function ${colors.green(createdFunction.id)} successfully created!`);
}

/**
 * Deploys a function
 * @param {Object} params
 * @param {Object} params.args
 * @param {string} params.args[0] - The file to deploy
 * @param {string} params.args[1] - The function ID to deploy to
 * @param {Object} params.options
 * @param {Object} params.options.org - The organisation to deploy the function to
 * @returns {Promise<void>}
 * @throws {Error} - If the file to deploy does not exist
 * @throws {Error} - If the function to deploy to does not exist
 * */
export async function deploy (params) {
  const [functionFile, functionId] = params.args;
  const { org } = params.options;

  const ownerId = (org != null && org.orga_name !== '')
    ? await Organisation.getId(org)
    : (await User.getCurrent()).id;

  if (!fs.existsSync(functionFile)) {
    throw new Error(`File ${colors.red(functionFile)} does not exist, it can't be deployed`);
  }

  const functions = await getFunctions({ ownerId }).then(sendToApi);
  const functionToDeploy = functions.find((f) => f.id === functionId);

  if (!functionToDeploy) {
    throw new Error(`Function ${colors.red(functionId)} not found, it can't be deployed`);
  }

  Logger.info(`Deploying ${functionFile}`);
  Logger.info(`Deploying to function ${functionId} of user ${ownerId}`);

  const fileExtension = functionFile.split('.').pop();
  const platform = PLATFORMS[fileExtension];

  if (!platform) {
    throw new Error(`File ${colors.red(functionFile)} is not a valid function file, it must be a .${Object.keys(PLATFORMS).join(', ')} file`);
  }

  let deployment = await createDeployment({
    ownerId,
    functionId,
  }, {
    name: null,
    description: null,
    tag: null,
    platform,
  }).then(sendToApi);

  Logger.debug(JSON.stringify(deployment, null, 2));

  await uploadFunction(deployment.uploadUrl, functionFile);
  await triggerDeployment({
    ownerId,
    functionId,
    deploymentId: deployment.id,
  }).then(sendToApi);

  Logger.println(`${colors.green('✓')} Function file uploaded successfully, packaging from ${platform} to WASM...`);

  await setTimeout(1_000);
  while (deployment.status !== 'READY') {
    Logger.debug(`Deployment status: ${deployment.status}`);
    deployment = await getDeployment({
      ownerId,
      functionId,
      deploymentId: deployment.id,
    }).then(sendToApi);
    await setTimeout(1_000);
  }

  Logger.println(`${colors.green('✓')} Your function is now packaged and deployed!`);
  Logger.println(`  └─ Test it: ${colors.blue(`curl https://functions-technical-preview.services.clever-cloud.com/${functionId}`)}`);
}

/**
 * Destroys a function and its deployments
 * @param {Object} params
 * @param {Object} params.args
 * @param {string} params.args[0] - The function ID to destroy
 * @param {Object} params.options
 * @param {Object} params.options.org - The organisation to destroy the function from
 * @returns {Promise<void>}
 * @throws {Error} - If the function to destroy does not exist
 * */
export async function destroy (params) {
  const [functionId] = params.args;
  const { org } = params.options;

  const ownerId = (org != null && org.orga_name !== '')
    ? await Organisation.getId(org)
    : (await User.getCurrent()).id;

  const functions = await getFunctions({ ownerId }).then(sendToApi);
  const functionToDelete = functions.find((f) => f.id === functionId);

  if (!functionToDelete) {
    throw new Error(`Function ${colors.red(functionId)} not found, it can't be deleted`);
  }

  const deployments = await getDeployments({ ownerId, functionId }).then(sendToApi);

  deployments.forEach(async (d) => {
    await deleteDeployment({ ownerId, functionId, deploymentId: d.id }).then(sendToApi);
  });

  await deleteFunction({ ownerId, functionId }).then(sendToApi);
  Logger.println(`${colors.green('✓')} Function ${colors.green(functionId)} and its deployments successfully deleted!`);
}

/**
 * Lists all the functions of the current user or the current organisation
 * @param {Object} params
 * @param {Object} params.options
 * @param {Object} params.options.org - The organisation to list the functions from
 * @param {string} params.options.format - The format to display the functions
 * @returns {Promise<void>}
 */
export async function list (params) {
  const { org, format } = params.options;

  const ownerId = (org != null && org.orga_name !== '')
    ? await Organisation.getId(org)
    : (await User.getCurrent()).id;

  const functions = await getFunctions({
    ownerId: ownerId,
  }).then(sendToApi);

  if (functions.length < 1) {
    Logger.println(`${colors.blue('🔎')} No functions found, create one with ${colors.blue('clever functions create')} command`);
    return;
  }

  switch (format) {
    case 'json':
      console.log(JSON.stringify(functions, null, 2));
      break;
    case 'human':
    default:
      console.table(functions, ['id', 'createdAt', 'updatedAt']);
  }
}

/**
 * Lists all the deployments of a function
 * @param {Object} params
 * @param {Object} params.args
 * @param {string} params.args[0] - The function ID to list the deployments from
 * @param {Object} params.options
 * @param {Object} params.options.org - The organisation to list the deployments from
 * @param {string} params.options.format - The format to display the deployments
 * @returns {Promise<void>}
 * */
export async function listDeployments (params) {
  const [functionId] = params.args;
  const { org, format } = params.options;

  const ownerId = (org != null && org.orga_name !== '')
    ? await Organisation.getId(org)
    : (await User.getCurrent()).id;

  const deploymentsList = await getDeployments({
    ownerId: ownerId, functionId,
  }).then(sendToApi);

  if (deploymentsList.length < 1) {
    Logger.println(`${colors.blue('🔎')} No deployments found for this function`);
    return;
  }

  switch (format) {
    case 'json':
      console.log(JSON.stringify(deploymentsList, null, 2));
      break;
    case 'human':
    default:
      console.table(deploymentsList, ['id', 'status', 'createdAt', 'updatedAt']);
      console.log(`▶️ You can call your function with ${colors.blue(`curl https://functions-technical-preview.services.clever-cloud.com/${functionId}`)}`);
  }
}
