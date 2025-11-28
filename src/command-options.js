import cliparse from 'cliparse';

export function getOutputFormatOption(formats = []) {
  const availableFormats = ['human', 'json', ...formats];
  return cliparse.option('format', {
    aliases: ['F'],
    metavar: 'format',
    parser: (format) => {
      if (!availableFormats.includes(format)) {
        throw new Error('The output format must be one of ' + availableFormats.join(', '));
      }
      return format;
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
      if (!availablePolicies.includes(policy)) {
        throw new Error(`the policy must be one of ${availablePolicies.join(', ')}`);
      }
      return policy;
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
      if (!availableExitOn.includes(exitOnStrategy)) {
        throw new Error(`The exit-on strategy must be one of ${availableExitOn.join(', ')}`);
      }
      return exitOnStrategy;
    },
    default: 'deploy-end',
    description: `Step at which the logs streaming is ended, steps are: ${availableExitOn.join(', ')}`,
    complete() {
      return cliparse.autocomplete.words(availableExitOn);
    },
  });
}
