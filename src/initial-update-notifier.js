import updateNotifierModule from 'update-notifier';
import pkg from '../package.json' with { type: 'json' };
import { hasParam } from './lib/has-param.js';

// These need to be set before Logger and other stuffs
const updateNotifierExplicitFalse = hasParam('--no-update-notifier') || hasParam('--update-notifier', 'false');
if (!updateNotifierExplicitFalse) {
  updateNotifierModule({
    pkg,
    tagsUrl: 'https://api.github.com/repos/CleverCloud/clever-tools/tags',
  }).notify({
    isGlobal: true,
    getDetails() {
      const docsUrl = 'https://github.com/CleverCloud/clever-tools/tree/master/docs#how-to-use-clever-tools';
      return `\nPlease follow this link to update your clever-tools:\n${docsUrl}`;
    },
  });
}
