import { releaseInfo as getLinuxInfos } from 'linux-release-info';
import os from 'node:os';
import pkg from '../../package.json' with { type: 'json' };
import { styleText } from '../lib/style-text.js';
import { Logger } from '../logger.js';
import { conf, loadOAuthConf } from '../models/configuration.js';
import * as User from '../models/user.js';

export async function diag(params) {
  const { format } = params.options;

  /** @type {string} */
  const userId = await User.getCurrentId().catch(() => null);
  const authDetails = await loadOAuthConf();

  function getAuthState() {
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
    commitId: pkg.commitId,
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
      Logger.println('clever-tools  ' + styleText('green', formattedDiag.version));
      // Only available in built binaries
      if (formattedDiag.commitId) {
        Logger.println('Commit        ' + styleText('green', formattedDiag.commitId));
      }
      Logger.println('Node.js       ' + styleText('green', formattedDiag.nodeVersion));
      Logger.println('Platform      ' + styleText('green', formattedDiag.platform));
      Logger.println('Release       ' + styleText('green', formattedDiag.release));
      Logger.println('Architecture  ' + styleText('green', formattedDiag.arch));
      if (formattedDiag.linuxInfos != null) {
        Logger.println('Linux         ' + styleText('green', formattedDiag.linuxInfos));
      }
      Logger.println('Shell         ' + styleText('green', formattedDiag.shell));
      Logger.println('Packaged      ' + styleText('green', String(formattedDiag.isPackaged)));
      Logger.println('Exec path     ' + styleText('green', formattedDiag.execPath));
      Logger.println('Config file   ' + styleText('green', formattedDiag.configFile));

      Logger.println('Auth source   ' + styleText('green', formattedDiag.authSource));

      const token =
        formattedDiag.oAuthToken == null ? styleText('red', '(none)') : styleText('green', formattedDiag.oAuthToken);
      Logger.println('oAuth token   ' + token);

      switch (formattedDiag.authState) {
        case 'authenticated': {
          Logger.println('User ID       ' + styleText('green', formattedDiag.userId));
          break;
        }
        case 'authentication failed': {
          Logger.println('User ID       ' + styleText('red', 'Authentication failed'));
          break;
        }
        case 'not connected': {
          Logger.println('User ID       ' + styleText('red', 'Not connected'));
        }
      }
    }
  }
}
