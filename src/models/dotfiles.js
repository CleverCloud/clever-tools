import os from 'os';
import path from 'path';

import * as Addons from './addon.js';
import * as KV from '../commands/kv.js';

import { Logger } from '../logger.js';
import { sendToApi } from './send-to-api.js';
import { findAddonsByNameOrId } from './ids-resolver.js';
import { get, getAllEnvVars } from '@clevercloud/client/cjs/api/v2/addon.js';

export const CCTOOLS_KV_DEFAULT_NAME = 'kv-cc-tools';
export const DOTFILES_DEFAULT_PATH = path.join(os.homedir(), '.cc-dotfiles');

export async function checkAndCreateCCToolsKV () {
  const found = await getCCToolsDotFilesAddons();
  if (found.length === 0) {
    Logger.info('CCTools KV not found, creating it');
    return;
  }
  else {
    Logger.info('CCTools KV already exists');
    Logger.debug(JSON.stringify(found));
  }

  return found;
}

export async function createCCToolsKV () {
  const created = await Addons.create({ name: CCTOOLS_KV_DEFAULT_NAME, providerName: 'kv', plan: 'ALPHA', region: 'par', addonOptions: {} });
  const url = created.env.find((env) => env.name === 'REDIS_URL')?.value;
  await KV.sendCommand(url, ['SET', 'dotfiles', '[]']);
}

export async function sendCommandCCToolsKV (command) {
  const found = await getCCToolsDotFilesKVID();

  if (found.length === '') {
    Logger.error('CCTools KV not found');
    return;
  }

  const envVars = await getAllEnvVars({ id: null, addonId: found }).then(sendToApi);
  const url = envVars.find((env) => env.name === 'REDIS_URL')?.value;

  return KV.sendCommand(url, command);
}

export function createCCToolsDotFilesBucket (cellarID) {
  return {
    source: 'none',
  };
}

export function syncCCToolsDotFiles (action) {
  return {
    source: 'none',
  };
}

export function listCCToolsDotFiles () {
  return {
    source: 'none',
  };
}

export async function getCCToolsDotFilesAddons () {
  const ids = await findAddonsByNameOrId(CCTOOLS_KV_DEFAULT_NAME);
  let response = [{}];
  if (ids.length !== 1) {
    Logger.info(`Cannot find the MateriaKV add-on ${CCTOOLS_KV_DEFAULT_NAME}`);
    response = ids;
  }
  else {
    Logger.info(`Found the add-on ${ids[0].addonId}`);
    response[0] = await get({ addonId: ids[0].addonId }).then(sendToApi);

    if (response[0].provider.id !== 'kv') {
      Logger.info('The found add-on is not Materia KV');
      response = [{}];
    }
  }

  return response;
}

export async function getCCToolsDotFilesKVID () {
  const found = await getCCToolsDotFilesAddons();
  if (found.length !== 1) {
    throw new Error(`Cannot find the MateriaKV add-on ${CCTOOLS_KV_DEFAULT_NAME}`);
  }

  return found[0].id;
}
