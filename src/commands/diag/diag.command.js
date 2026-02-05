import { get as getUser } from '@clevercloud/client/esm/api/v2/organisation.js';
import { releaseInfo as getLinuxInfos } from 'linux-release-info';
import os from 'node:os';
import pkg from '../../../package.json' with { type: 'json' };
import { config } from '../../config/config.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { sendToApi } from '../../models/send-to-api.js';
import { humanJsonOutputFormatOption } from '../global.options.js';

function getShell() {
  const platform = os.platform();

  if (platform === 'win32') {
    if (process.env.PSModulePath) {
      if (process.env.WT_SESSION) {
        return 'PowerShell (Windows Terminal)';
      }
      if (process.env.PSVersionTable || process.env.POWERSHELL_DISTRIBUTION_CHANNEL) {
        return 'PowerShell Core';
      }
      return 'Windows PowerShell';
    }
    if (process.env.WT_SESSION) {
      return 'Windows Terminal (cmd)';
    }
    return process.env.ComSpec || 'cmd.exe';
  }

  return process.env.SHELL || 'unknown';
}

function getTerminal() {
  if (process.env.WT_SESSION) {
    return 'Windows Terminal';
  }
  return process.env.TERM_PROGRAM || process.env.TERMINAL_EMULATOR || process.env.TERM;
}

function getAuthState({ hasToken, apiUser }) {
  if (!hasToken) {
    return 'not connected';
  }
  if (apiUser == null) {
    return 'authentication failed';
  }
  return 'authenticated';
}

export const diagCommand = defineCommand({
  description: 'Diagnose the current installation (prints various informations for support)',
  since: '1.6.0',
  options: {
    format: humanJsonOutputFormatOption,
  },
  async handler(options) {
    const activeProfile = config.profiles[0];
    const user = await getUser({})
      .then(sendToApi)
      .catch(() => null);

    const formattedDiag = {
      version: pkg.version,
      commitId: pkg.commitId,
      nodeVersion: process.version,
      platform: os.platform(),
      release: os.release(),
      arch: process.arch,
      shell: getShell(),
      terminal: getTerminal(),
      isPackaged: process.pkg != null,
      execPath: process.execPath,
      configFile: config.CONFIGURATION_FILE,
      profile: activeProfile?.alias ?? null,
      userId: activeProfile?.userId ?? user?.id ?? null,
      authSource: activeProfile?.alias === '$env' ? 'environment variables' : 'configuration file',
      oAuthToken: config.token,
      loggedIn: user != null,
      profileOverrides: activeProfile?.overrides ?? null,
      // No longer useful but kept for compatibility reasons
      authState: getAuthState({ hasToken: config.token != null, apiUser: user }),
    };

    const linuxInfos = await getLinuxInfos()
      .then(({ pretty_name, name, id }) => pretty_name || name || id)
      .catch(() => null);
    if (linuxInfos != null) {
      formattedDiag.linuxInfos = linuxInfos;
    }

    switch (options.format) {
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
        Logger.println('Terminal      ' + styleText('green', formattedDiag.terminal));
        Logger.println('Packaged      ' + styleText('green', formattedDiag.isPackaged));
        Logger.println('Exec path     ' + styleText('green', formattedDiag.execPath));
        Logger.println('Config file   ' + styleText('green', formattedDiag.configFile));

        if (formattedDiag.profile != null) {
          Logger.println('Profile       ' + styleText('green', formattedDiag.profile));
          if (formattedDiag.userId != null) {
            Logger.println('User ID       ' + styleText('green', formattedDiag.userId));
          }
          Logger.println('Auth source   ' + styleText('green', formattedDiag.authSource));
          Logger.println('Auth token    ' + styleText('green', formattedDiag.oAuthToken));
        }

        if (formattedDiag.profile == null) {
          Logger.println('Auth state    ' + styleText('red', 'not connected'));
        } else if (formattedDiag.loggedIn) {
          Logger.println('Auth state    ' + styleText('green', 'valid token'));
        } else {
          Logger.println('Auth state    ' + styleText('red', 'expired or revoked token'));
        }

        if (formattedDiag.profileOverrides != null) {
          const overrideEntries = Object.entries(formattedDiag.profileOverrides).filter(([k, v]) => v != null);
          if (overrideEntries.length > 0) {
            const maxKeyLength = Math.max(...overrideEntries.map(([key]) => key.length));
            const pad = maxKeyLength + 2;
            Logger.println('');
            Logger.println('Profile overrides:');
            for (const [key, value] of overrideEntries) {
              Logger.println('  ' + key.padEnd(pad) + styleText('green', value));
            }
          }
        }
      }
    }
  },
});
