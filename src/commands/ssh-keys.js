import { confirm } from '../lib/prompts.js';
import { styleText } from 'node:util';
import { Logger } from '../logger.js';
import fs from 'node:fs';
import { sendToApi } from '../models/send-to-api.js';
import { openBrowser } from '../models/utils.js';
import dedent from 'dedent';
import {
  todo_addSshKey as addSshKey,
  todo_getSshKeys as getSshKeys,
  todo_removeSshKey as removeSshKey,
} from '@clevercloud/client/esm/api/v2/user.js';

/**
 * List SSH keys of the current user
 * @param {object} params The command parameters
 * @param {string} params.options.format The output format
 */
export async function list (params) {
  const { format } = params.options;

  const keys = await getUserSshKeys();

  switch (format) {
    case 'json': {
      Logger.printJson(keys);
      break;
    }
    case 'human':
    default: {
      if (keys.length === 0) {
        Logger.println(dedent`
          ${styleText('blue', '🔐 No SSH keys')}
          
          To list the SSH keys on your local system, use the following command:
          ${styleText('grey', 'ssh-add -l -E sha256')}
          
          To create a new key pair, use the following command:
          ${styleText('grey', 'ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_clever -C "An optional comment"')}
          
          Then add the public key to your Clever Cloud account:
          ${styleText('grey', 'clever ssh-keys add myNewKey ~/.ssh/id_ed25519_clever.pub')}
        `);
        return;
      }

      Logger.println(`🔐 ${keys.length} SSH key(s):`);
      keys.forEach((key) => {
        Logger.println(` • ${styleText('blue', key.name)}`, styleText('grey', `(${key.fingerprint})`));
      });
    }
  }
}

/**
 * Add a SSH key to the current user
 * @param {object} params The command parameters
 * @param {Array<string>} params.args
 */
export async function add (params) {
  const [keyName, filePath] = params.args;

  if (!fs.existsSync(filePath)) {
    throw new Error(`File ${filePath} does not exist`);
  }

  const pubKeyContent = fs.readFileSync(filePath, 'utf8').trim();
  Logger.debug(`SSH key file content: ${pubKeyContent}`);

  try {
    await addSshKey({ key: encodeURIComponent(keyName) }, JSON.stringify(pubKeyContent)).then(sendToApi);
  }
  catch (e) {
    console.log(e?.responseBody?.id);
    if (e?.responseBody?.id === 505) {
      throw new Error('This SSH key is not valid, please make sure you\'re pointing to the public key file');
    }
  }

  Logger.printSuccess(`SSH key ${keyName} added successfully`);
}

/**
 * Remove a SSH key from the current user
 * @param {object} params The command parameters
 * @param {Array<string>} params.args
 */
export async function remove (params) {
  const [keyName] = params.args;

  const keys = await getUserSshKeys();

  if (keys.find((key) => key.name === keyName) == null) {
    throw new Error(`SSH key ${styleText('red', keyName)} not found`);
  }

  const keyNameEncoded = encodeURIComponent(keyName);
  await removeSshKey({ key: keyNameEncoded }).then(sendToApi);

  Logger.printSuccess(`SSH key ${keyName} removed successfully`);
}

/**
 * Remove all SSH keys from the current user
 * @param {object} params The command parameters
 * @param {object} params.options The command options
 * @param {boolean} params.options.yes The user confirmation
 */
export async function removeAll (params) {
  if (!params.options.yes) {
    await confirm(
      'Are you sure you want to remove all your SSH keys?',
      'No SSH keys removed',
    );
  }

  const keys = await getUserSshKeys();

  if (keys.length === 0) {
    Logger.println('No SSH keys to remove');
    return;
  }

  const results = await Promise.all(
    keys.map((key) => {
      const keyNameEncoded = encodeURIComponent(key.name);
      return removeSshKey({ key: keyNameEncoded }).then(sendToApi)
        .then(() => [true, key.name])
        .catch(() => [false, key.name]);
    }),
  );

  if (results.every(([isRemoved]) => isRemoved)) {
    Logger.printSuccess('All SSH keys were removed successfully');
  }
  else {
    const keyNamesWithErrors = results
      .filter(([isRemoved]) => !isRemoved)
      .map(([_, keyName]) => keyName)
      .join(', ');
    throw new Error(`Some errors occured while removing these SSH keys: ${keyNamesWithErrors}`);
  }
}

/**
 * Open the SSH keys management page of the Console in your browser
 * @returns {Promise<void>} A promise that resolves when the page is opened
 */
export function openConsole () {
  return openBrowser('/users/me/ssh-keys', 'Opening the SSH keys management page of the Console in your browser');
}

/**
 * @return {Promise<Array<{ name: string, key: string, fingerprint: string }>>}
 */
async function getUserSshKeys () {
  const rawKeys = await getSshKeys().then(sendToApi);
  return rawKeys.sort((a, b) => a.name.localeCompare(b.name));
}
