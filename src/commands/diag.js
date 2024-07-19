import os from 'os';

import { releaseInfo as getLinuxInfos } from 'linux-release-info';
import colors from 'colors/safe.js';

import { Logger } from '../logger.js';
import { getPackageJson } from '../load-package-json.js';
import * as User from '../models/user.js';
import { conf, loadOAuthConf } from '../models/configuration.js';

const pkg = getPackageJson();

export async function diag (params) {
  const { format } = params.options;

  /** @type {string} */
  const userId = await User.getCurrentId().catch(() => null);
  const authDetails = await loadOAuthConf();

  function getAuthState () {
    if (authDetails.token == null) {
      return 'not connected';
    }

    if (userId == null) {
      return 'authentication failed';
    }

    return 'authenticated';
  }

  const formattedDiag = {
    version: pkg.version,
    nodeVersion: process.version,
    platform: os.platform(),
    release: os.release(),
    arch: process.arch,
    shell: process.env.SHELL,
    isPackaged: process.pkg != null,
    execPath: process.execPath,
    configFile: conf.CONFIGURATION_FILE,
    authSource: authDetails.source,
    oAuthToken: authDetails.token,
    authState: getAuthState(),
    userId,
  };

  const linuxInfos = await getLinuxInfos()
    .then(({ pretty_name, name, id }) => pretty_name || name || id)
    .catch(() => null);
  if (linuxInfos != null) {
    formattedDiag.linuxInfos = linuxInfos;
  }

  switch (format) {
    case 'json': {
      Logger.printJson(formattedDiag);
      break;
    }
    case 'human':
    default: {
      Logger.println('clever-tools  ' + colors.green(formattedDiag.version));
      Logger.println('Node.js       ' + colors.green(formattedDiag.nodeVersion));
      Logger.println('Platform      ' + colors.green(formattedDiag.platform));
      Logger.println('Release       ' + colors.green(formattedDiag.release));
      Logger.println('Architecture  ' + colors.green(formattedDiag.arch));
      if (formattedDiag.linuxInfos != null) {
        Logger.println('Linux         ' + colors.green(formattedDiag.linuxInfos));
      }
      Logger.println('Shell         ' + colors.green(formattedDiag.shell));
      Logger.println('Packaged      ' + colors.green(formattedDiag.isPackaged));
      Logger.println('Exec path     ' + colors.green(formattedDiag.execPath));
      Logger.println('Config file   ' + colors.green(formattedDiag.configFile));

      Logger.println('Auth source   ' + colors.green(formattedDiag.authSource));

      const token = formattedDiag.oAuthToken == null ? colors.red('(none)') : colors.green(formattedDiag.oAuthToken);
      Logger.println('oAuth token   ' + token);

      switch (formattedDiag.authState) {
        case 'authenticated': {
          Logger.println('User ID       ' + colors.green(formattedDiag.userId));
          break;
        }
        case 'authentication failed': {
          Logger.println('User ID       ' + colors.red('Authentication failed'));
          break;
        }
        case 'not connected': {
          Logger.println('User ID       ' + colors.red('Not connected'));
        }
      }
    }
  }
}
