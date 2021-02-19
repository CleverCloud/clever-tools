'use strict';

const { execSync, spawnSync } = require('child_process');
const Logger = require('../../logger.js');

function privateKey () {
  return execSync('wg genkey', { encoding: 'utf-8' }).trim();
}

function publicKey (privateKey) {
  return execSync(`echo '${privateKey}' | wg pubkey`, { encoding: 'utf-8' }).trim();
}

function up (confPath) {
  // We must use `spawn` with `detached: true` instead of `exec`
  // because `wg-quick up` starts a `wireguard-go` used by `wg-quick down`
  const { stdout, stderr } = spawnSync('wg-quick', ['up', confPath], { detached: true, encoding: 'utf-8' });
  if (stdout.length > 0) Logger.debug(stdout.trim());
  if (stderr.length > 0) Logger.debug(stderr.trim());
  Logger.println('Activated WireGuard® tunnel');
}

function update (confPath, interfaceName) {
  try {
    // Update WireGuard® configuration
    execSync(`wg-quick strip ${confPath} | wg syncconf ${interfaceName} /dev/stdin`);
    Logger.info('Updated WireGuard® tunnel configuration');
  }
  catch (error) {
    Logger.error(`Error updating WireGuard® tunnel configuration: ${error}`);
    process.exit(1);
  }
}

function down (confPath) {
  const { stdout, stderr } = spawnSync('wg-quick', ['down', confPath], { encoding: 'utf-8' });
  if (stdout.length > 0) Logger.debug(stdout.trim());
  if (stderr.length > 0) Logger.debug(stderr.trim());
}

/**
 * Check that `wg` and `wg-quick` are installed
 */
function checkAvailable () {
  try {
    // The redirect to `/dev/null` ensures that your program does not produce the output of these commands.
    execSync('which wg > /dev/null 2>&1');
    execSync('which wg-quick > /dev/null 2>&1');

    // FIXME: Handle Windows
    //        - Those checks won't work on Windows, and wg-quick doesn't exist anyway.
    //          - We need to wait for a Windows version of wg-quick to support the rest of the operations
    //          - Or we could use vanilla wg on Windows, and wg-quick on other OSs
    return true;
  }
  catch {
    return false;
  }
}

module.exports = {
  privateKey,
  publicKey,
  up,
  update,
  down,
  checkAvailable,
};
