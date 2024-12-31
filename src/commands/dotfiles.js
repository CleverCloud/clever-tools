import fs from 'fs';
import os from 'os';
import path from 'path';
import colors from 'colors/safe.js';

import { Logger } from '../logger.js';
import { CCTOOLS_KV_DEFAULT_NAME, createCCToolsKV, getCCToolsDotFilesAddons, sendCommandCCToolsKV } from '../models/dotfiles.js';

const HOME_DIR = os.homedir();

export async function init () {

  const ccKV = await getCCToolsDotFilesAddons();

  if (ccKV.length === 0) {
    Logger.info('Clever Cloud KV not found, we create it');
    createCCToolsKV();
    Logger.println(`${colors.green('√')} Dotfiles service successfully initialized in Materia KV ${colors.green(CCTOOLS_KV_DEFAULT_NAME)}`);
  }
  else if (ccKV.length > 1) {
    Logger.error('Multiple Clever Cloud KV found');
  }
  else {
    Logger.println(`${colors.green('√')} Dotfiles service already initialized in Materia KV ${colors.green(CCTOOLS_KV_DEFAULT_NAME)}`);
  }
}

export async function add (params) {
  const [dotFile] = params.args;
  const dotfiles = JSON.parse(await sendCommandCCToolsKV(['GET', 'dotfiles']));

  const dotfilePath = path.join(HOME_DIR, dotFile);
  if (!fs.existsSync(dotfilePath)) {
    Logger.error(`Dotfile ${colors.red(dotFile)} does not exist in your home directory`);
    return;
  }

  if (!dotfiles.includes(dotFile)) {
    dotfiles.push(dotFile);
    await sendCommandCCToolsKV(['SET', 'dotfiles', JSON.stringify(dotfiles)]);
    Logger.println(`${colors.green('√')} Dotfile ${colors.green(dotFile)} successfully added to your Clever Cloud account`);
  }
  else {
    Logger.println(`${colors.yellow('!')} Dotfile ${colors.yellow(dotFile)} is already present in your Clever Cloud account`);
  }
}

export async function remove (params) {
  const [dotFile] = params.args;
  const dotfiles = JSON.parse(await sendCommandCCToolsKV(['GET', 'dotfiles']));

  if (dotfiles.includes(dotFile)) {
    const newDotfiles = dotfiles.filter((filename) => filename !== dotFile);
    await sendCommandCCToolsKV(['SET', 'dotfiles', JSON.stringify(newDotfiles)]);
    await sendCommandCCToolsKV(['DEL', dotFile]);
    Logger.println(`${colors.green('√')} Dotfile ${colors.green(dotFile)} successfully removed from your Clever Cloud account`);
  }
  else {
    Logger.error(`Dotfile ${colors.red(dotFile)} is not present in your Clever Cloud account`);
  }
}

export async function list () {
  const dotfiles = JSON.parse(await sendCommandCCToolsKV(['GET', 'dotfiles']));

  if (dotfiles.length === 0) {
    Logger.println(`${colors.blue('i')} No dotfiles synced to your Clever Cloud account, use ${colors.blue('clever dotfiles add')} to add some`);
  }
  else {
    Logger.println(`${colors.blue('i')} Dotfiles synced to your Clever Cloud account:`);
    dotfiles.forEach((filename) => {
      Logger.println(` - ${filename}`);
    });
  }
}
export async function sync (params) {
  const dotfiles = JSON.parse(await sendCommandCCToolsKV(['GET', 'dotfiles']));

  if (dotfiles.length === 0) {
    Logger.error('No dotfiles to sync, use `clever dotfiles add` to add some');
    return;
  }

  for (const dotFile of dotfiles) {

    const dotfilePath = path.join(HOME_DIR, dotFile);
    if (!fs.existsSync(dotfilePath)) {
      Logger.error(`Dotfile ${colors.red(dotFile)} does not exist locally`);
      continue;
    }

    const localContent = fs.readFileSync(dotfilePath, 'utf8');
    const remoteContent = await sendCommandCCToolsKV(['GET', dotFile]);
    let remotePayload = null;

    if (remoteContent) {
      remotePayload = JSON.parse(remoteContent);
    }

    if (remotePayload && localContent === remotePayload.content) {
      Logger.println(`${colors.yellow('!')} Dotfile ${colors.yellow(dotFile)} is identical locally and remotely`);
      continue;
    }

    const localLastModified = fs.statSync(dotfilePath).mtime;
    const remoteLastUpdate = remotePayload ? new Date(remotePayload.lastUpdate) : null;

    if (!remotePayload || localLastModified > remoteLastUpdate) {
      const timestamp = new Date().toISOString();
      const payload = {
        name: dotFile,
        content: localContent,
        lastUpdate: timestamp,
      };

      // Store each version individually
      const historyKey = `${dotFile}:${timestamp}:local`;
      await sendCommandCCToolsKV(['SET', historyKey, localContent]);

      // Retrieve all versions of the dotfile
      const allKeys = JSON.parse(await sendCommandCCToolsKV(['KEYS', `${dotFile}:*`]));
      const versionKeys = allKeys.filter((key) => key.startsWith(`${dotFile}:`)).sort().reverse();

      // Keep only the latest 5 versions
      const keysToDelete = versionKeys.slice(5);
      for (const key of keysToDelete) {
        await sendCommandCCToolsKV(['DEL', key]);
      }

      await sendCommandCCToolsKV(['SET', dotFile, JSON.stringify(payload)]);
      Logger.println(`${colors.green('√')} Dotfile ${colors.green(dotFile)} successfully updated to Clever Cloud service`);
    }
    else {
      fs.writeFileSync(dotfilePath, remotePayload.content, 'utf8');
      Logger.println(`${colors.green('√')} Dotfile ${colors.green(dotFile)} successfully updated from Clever Cloud service`);
    }
  }
}
