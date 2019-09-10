'use strict';

const os = require('os');

const getLinuxInfos = require('linux-release-info');
const colors = require('colors/safe');

const Logger = require('../logger.js');
const pkg = require('../../package.json');
const User = require('../models/user.js');
const { loadOAuthConf } = require('../models/configuration.js');

async function diag () {

  const userId = await User.getCurrent().then((u) => u.id).catch(() => 'Not connected');
  const oauthToken = await loadOAuthConf().toPromise().then((o) => o.token).catch(() => 'Not connected');

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

  const isPackaged = (process.pkg != null);
  Logger.println('Packaged      ' + colors.green(isPackaged));
  Logger.println('Exec path     ' + colors.green(process.execPath));

  Logger.println('User id       ' + colors.green(userId || 'Not connected'));
  Logger.println('oAuth token   ' + colors.green(oauthToken));
}

module.exports = { diag };
