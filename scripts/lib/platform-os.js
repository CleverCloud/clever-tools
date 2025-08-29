import { platform } from 'node:os';

/**
 * @typedef {import('./common.types.js').OS} OS
 */

/** @type {OS[]} */
export const SUPPORTED_OS = ['linux', 'macos', 'win'];

/**
 * Gets the current operating system in a normalized format.
 * Maps Node.js platform() values to simplified OS names.
 * @returns {OS}
 */
export function getOs() {
  switch (platform()) {
    case 'linux':
      return 'linux';
    case 'darwin':
      return 'macos';
    case 'win32':
      return 'win';
    default:
      throw new Error(`Unsupported platform: ${platform()}`);
  }
}

/**
 * Returns an emoji representing the given operating system.
 * @param {OS} os - The operating system
 * @returns {string}
 */
export function getEmoji(os) {
  switch (os) {
    case 'linux':
      return '🐧';
    case 'macos':
      return '🍏';
    case 'win':
      return '🪟';
  }
}
