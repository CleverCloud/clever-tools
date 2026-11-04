import pkg from '../package.json' with { type: 'json' };
import { hasParam } from './lib/has-param.js';

/**
 * Set up the update notifier: check for a new version and notify the user when there is one.
 * `nano-updater` is imported only when the notifier is not disabled,
 * so `--no-update-notifier` skips the cost of loading it.
 * @returns {Promise<void>}
 */
export async function setupUpdateNotifier() {
  const updateNotifierExplicitFalse = hasParam('--no-update-notifier') || hasParam('--update-notifier', 'false');
  // Skipped in a pkg binary: the check cannot run in the background there, so it would delay the command
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
