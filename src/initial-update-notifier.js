import updateNotifierModule from 'update-notifier';
import pkg from '../package.json' with { type: 'json' };
import { hasParam } from './lib/has-param.js';

// These need to be set before Logger and other stuffs
const updateNotifierExplicitFalse = hasParam('--no-update-notifier') || hasParam('--update-notifier', 'false');
if (!updateNotifierExplicitFalse) {
  const docsUrl = 'https://github.com/CleverCloud/clever-tools/blob/master/docs/update.md';
  updateNotifierModule({
    pkg,
  }).notify({
    isGlobal: true,
    message: `Update available {currentVersion} -> {latestVersion}\nPlease follow this link to update your clever-tools:\n${docsUrl}`,
  });
}
