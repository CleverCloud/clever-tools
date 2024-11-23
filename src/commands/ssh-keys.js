import * as Interact from '../models/interact.js';
import colors from 'colors/safe.js';

import { Logger } from '../logger.js';
import { existsSync, readFileSync } from 'node:fs';
import { executeCommand, openBrowser } from '../models/utils.js';
import { getKeys, addKey, removeKey } from '../models/ssh-keys.js';

/**
 * List SSH keys of the current user
 * @param {object} params The command parameters
 * @param {string} params.options.format The output format
 */
export async function list (params) {
  const { format } = params.options;

  const keys = (await getKeys());

  switch (format) {
    case 'json': {
      Logger.printJson(keys);
      break;
    }
    case 'human':
    default: {
      printKeysHuman(keys);
    }
  }
}

/**
 * Add a SSH key to the current user
 * @param {{ namedArgs: { "ssh-key-name": string, "ssh-key-path": string } }} params The command parameters
 */
export async function add (params) {
  const { 'ssh-key-name': keyName, 'ssh-key-path': filePath } = params.namedArgs;

  if (!existsSync(filePath)) {
    Logger.error(`File ${filePath} does not exist`);
    return;
  }

  const fileContent = readFileSync(filePath, 'utf8').trim();
  Logger.debug(`SSH key file content: ${fileContent}`);

  executeCommand(addKey, [keyName, fileContent]);
}

/** Remove a SSH key from the current user
 * @param {{ namedArgs: { "ssh-key-name": string } }} params The command parameters
 */
export async function remove (params) {
  const { 'ssh-key-name': keyName } = params.namedArgs;
  executeCommand(removeKey, [keyName]);
}

/**
 * Remove all SSH keys from the current user
 * @param {object} params The command parameters
 * @param {string} params.options.yes The user confirmation
 */
export async function clear (params) {
  const keys = await getKeys();

  if (!keys.length) {
    Logger.println('No SSH keys to remove');
    return;
  }

  if (!params.options.yes) {
    await Interact.confirm(
      'Are you sure you want to remove all your SSH keys? (y/n) ',
      'No SSH keys removed',
    );
  }

  await Promise.all(keys.map(removeKey));
  Logger.println('All SSH keys removed');
}

/**
 * Print the SSH keys of the current user in human-readable format
 * @param {object[]} keys The SSH keys of the current user
 */
function printKeysHuman (keys) {
  if (!keys.length) {
    Logger.println('No SSH keys');
    return;
  }

  if (keys.length === 1) {
    Logger.println(`🔐 SSH key: ${keys[0].name} (${keys[0].fingerprint})`);
    return;
  }

  Logger.println(`🔐 SSH keys (${keys.length}):`);
  keys.forEach((k) => {
    Logger.println(` ▶ ${colors.green(k.name)}`, colors.green(`(${k.fingerprint})`));
  });
}

/**
 * Open the SSH keys management page of the Console in your browser
 * @returns {Promise<void>} A promise that resolves when the page is opened
 */
export async function openConsole () {
  openBrowser('https://console.clever-cloud.com/users/me/ssh-keys', 'Opening the SSH keys management page in your browser');
}
