import path from 'node:path';
// @ts-expect-error - no types available for this module
import xdg from 'xdg';

/**
 * Resolves the full path for a configuration file.
 * @param {string} configFile - The name of the configuration file
 * @returns {string} The absolute path to the configuration file
 */
export function getConfigPath(configFile) {
  return path.resolve(getConfigDir(), configFile);
}

/**
 * Gets the cache directory path based on the operating system.
 * On Windows, uses APPDATA/clever-cloud/cache, on other platforms uses XDG cache path.
 * @returns {string} The absolute path to the cache directory
 */
export function getCacheDir() {
  return process.platform === 'win32' && process.env.APPDATA != null
    ? path.resolve(process.env.APPDATA, 'clever-cloud', 'cache')
    : xdg.basedir.cachePath('clever-cloud');
}

/**
 * Gets the configuration directory path based on the operating system.
 * On Windows, uses APPDATA/clever-cloud, on other platforms uses XDG config path.
 * @returns {string} The absolute path to the configuration directory
 */
function getConfigDir() {
  return process.platform === 'win32' && process.env.APPDATA != null
    ? path.resolve(process.env.APPDATA, 'clever-cloud')
    : xdg.basedir.configPath('clever-cloud');
}
