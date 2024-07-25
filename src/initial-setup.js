import colors from 'colors/safe.js';
import { getPackageJson } from './load-package-json.cjs';
import updateNotifierModule from 'update-notifier';

function hasParam (param, paramValue) {
  const index = process.argv.indexOf(param);
  if (index === -1) {
    return false;
  }
  if (paramValue != null) {
    return process.argv[index + 1] === paramValue;
  }
  return true;
}

// These need to be set before Logger and other stuffs
if (hasParam('-v') || hasParam('--verbose')) {
  process.env.CLEVER_VERBOSE = '1';
}

// These need to be set before Logger and other stuffs
// Don't log anything in autocomplete mode
if (hasParam('--autocomplete-index')) {
  process.env.CLEVER_QUIET = '1';
}

// These need to be set before other stuffs
const colorExplicitFalse = hasParam('--no-color') || hasParam('--color', 'false');
const colorExplicitTrue = hasParam('--color', 'true');
if (colorExplicitFalse || (!process.stdout.isTTY && !colorExplicitTrue)) {
  colors.disable();
}

// These need to be set before Logger and other stuffs
const pkg = getPackageJson();
const isRunThroughPackagedBinary = process.pkg != null;
const updateNotifierExplicitFalse = hasParam('--no-update-notifier') || hasParam('--update-notifier', 'false');
if (!updateNotifierExplicitFalse && !isRunThroughPackagedBinary) {
  updateNotifierModule({
    pkg,
    tagsUrl: 'https://api.github.com/repos/CleverCloud/clever-tools/tags',
  }).notify({
    getDetails () {
      const docsUrl = 'https://www.clever-cloud.com/doc/clever-tools/getting_started';
      return `\nPlease follow this link to update your clever-tools:\n${docsUrl}`;
    },
  });
}
