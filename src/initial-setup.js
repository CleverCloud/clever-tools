import pkg from '../package.json' with { type: 'json' };
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
  process.env.NO_COLOR = '1';
}

// These need to be set before Logger and other stuffs
const isRunThroughPackagedBinary = process.pkg != null;
const updateNotifierExplicitFalse = hasParam('--no-update-notifier') || hasParam('--update-notifier', 'false');
if (!updateNotifierExplicitFalse && !isRunThroughPackagedBinary) {
  updateNotifierModule({
    pkg,
    tagsUrl: 'https://api.github.com/repos/CleverCloud/clever-tools/tags',
  }).notify({
    isGlobal: true,
    getDetails () {
      const docsUrl = 'https://github.com/CleverCloud/clever-tools/tree/master/docs#how-to-use-clever-tools';
      return `\nPlease follow this link to update your clever-tools:\n${docsUrl}`;
    },
  });
}
