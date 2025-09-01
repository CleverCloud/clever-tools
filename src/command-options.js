import cliparse from 'cliparse';

export function getOutputFormatOption(formats = []) {
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
    complete() {
      return cliparse.autocomplete.words(availableFormats);
    },
  });
}

export function getSameCommitPolicyOption() {
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
    complete() {
      return cliparse.autocomplete.words(availablePolicies);
    },
  });
}

export function getExitOnOption() {
  const availableExitOn = ['deploy-start', 'deploy-end', 'never'];
  return cliparse.option('exit-on', {
    aliases: ['e'],
    metavar: 'step',
    parser: (exitOnStrategy) => {
      return availableExitOn.includes(exitOnStrategy)
        ? cliparse.parsers.success(exitOnStrategy)
        : cliparse.parsers.error(`The exit-on strategy must be one of ${availableExitOn.join(', ')}`);
    },
    default: 'deploy-end',
    description: `Step at which the logs streaming is ended, steps are: ${availableExitOn.join(', ')}`,
    complete() {
      return cliparse.autocomplete.words(availableExitOn);
    },
  });
}
