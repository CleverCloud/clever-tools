const cliparse = require('cliparse');

function getOutputFormatOption (formats = []) {
  const availableFormats = ['human', 'json', ...formats];
  return cliparse.option('format', {
    aliases: ['F'],
    metavar: 'format',
    parser: (format) => {
      return availableFormats.includes(format)
        ? cliparse.parsers.success(format)
        : cliparse.parsers.error('The output format must be one of ' + availableFormats.join(', '));
    },
    default: 'human',
    description: `Output format (${availableFormats.join(', ')})`,
    complete () {
      return cliparse.autocomplete.words(availableFormats);
    },
  });
}

function getSameCommitPolicyOption () {
  const availablePolicies = ['error', 'ignore', 'restart', 'rebuild'];
  return cliparse.option('same-commit-policy', {
    aliases: ['p'],
    metavar: 'policy',
    parser: (policy) => {
      return availablePolicies.includes(policy)
        ? cliparse.parsers.success(policy)
        : cliparse.parsers.error(`the policy must be one of ${availablePolicies.join(', ')}`);
    },
    default: 'error',
    description: `What to do when local and remote commit are identical (${availablePolicies.join(', ')})`,
    complete () {
      return cliparse.autocomplete.words(availablePolicies);
    },
  });
}

module.exports = {
  getOutputFormatOption,
  getSameCommitPolicyOption,
};
