'use strict';

const os = require('os');

const { releaseInfo: getLinuxInfos } = require('linux-release-info');
const colors = require('colors/safe');

const Logger = require('../logger.js');
const pkg = require('../../package.json');
const User = require('../models/user.js');
const { conf, loadOAuthConf } = require('../models/configuration.js');

async function diag () {

  const userId = await User.getCurrentId().catch(() => null);
  const authDetails = await loadOAuthConf();

  Logger.println('clever-tools  ' + colors.green(pkg.version));
  Logger.println('Node.js       ' + colors.green(process.version));

  Logger.println('Platform      ' + colors.green(os.platform()));
  Logger.println('Release       ' + colors.green(os.release()));
  Logger.println('Architecture  ' + colors.green(process.arch));

  // Linux specific
  const linuxInfos = await getLinuxInfos().then(({ pretty_name, name, id }) => pretty_name || name || id).catch(() => null);
  if (linuxInfos != null) {
    Logger.println('Linux         ' + colors.green(linuxInfos));
  }

  Logger.println('Shell         ' + colors.green(process.env.SHELL));

  const isPackaged = (process.pkg != null);
  Logger.println('Packaged      ' + colors.green(isPackaged));
  Logger.println('Exec path     ' + colors.green(process.execPath));
  Logger.println('Config file   ' + colors.green(conf.CONFIGURATION_FILE));
  Logger.println('Auth source   ' + colors.green(authDetails.source));

  const oauthToken = (authDetails.token != null)
    ? colors.green(authDetails.token)
    : colors.red('(none)');
  Logger.println('oAuth token   ' + oauthToken);

  if (authDetails.token != null) {
    if (userId != null) {
      Logger.println('User ID       ' + colors.green(userId));
    }
    else {
      Logger.println('User ID       ' + colors.red('Authentication failed'));
    }
  }
  else {
    Logger.println('User ID       ' + colors.red('Not connected'));
  }
}

module.exports = { diag };
