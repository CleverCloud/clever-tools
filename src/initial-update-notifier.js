import pkg from '../package.json' with { type: 'json' };
import { hasParam } from './lib/has-param.js';

/**
 * Notify the user when a new version is available.
 * `nano-updater` is imported only when the notifier is not disabled,
 * so `--no-update-notifier` skips the cost of loading it.
 * @returns {Promise<void>}
 */
export async function notifyUpdate() {
  const updateNotifierExplicitFalse = hasParam('--no-update-notifier') || hasParam('--update-notifier', 'false');
  // A pkg binary has no `update.js` next to it to spawn, so `nano-updater` would wait for the registry in the process,
  // with a timeout of 30 s, before the command starts. `update-notifier` never checked from a pkg binary either.
  if (updateNotifierExplicitFalse || process.pkg != null) {
    return;
  }
  const { notifier } = await import('nano-updater');
  const instance = await notifier({ name: pkg.name, version: pkg.version });
  const docsUrl = 'https://github.com/CleverCloud/clever-tools/blob/master/docs/update.md';
  instance.notify({
    message: `Update available ${instance.current} -> ${instance.latest}\nPlease follow this link to update your clever-tools:\n${docsUrl}`,
  });
}
