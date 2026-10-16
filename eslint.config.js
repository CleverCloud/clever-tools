import { cleverCloud } from '@clevercloud/eslint-config';
import { includeIgnoreFile } from '@eslint/compat';
import globals from 'globals';
import path from 'node:path';

const gitignorePath = path.resolve('./.gitignore');

export default [
  includeIgnoreFile(gitignorePath),
  {
    name: 'global config',
    ...cleverCloud.configs.node,
    files: ['bin/*.js', 'src/**/*.js', 'scripts/**/*.js', '.claude/hooks/*.js'],
    languageOptions: {
      ecmaVersion: 2025,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // The shared rules must be spread here: a `rules` key placed after the spread
      // config replaces them all instead of merging with them
      ...cleverCloud.configs.node.rules,
      'n/prefer-node-protocol': 'error',
      'prefer-const': 'error',
      // @ts-expect-error fails once the error is gone, @ts-ignore stays silently
      'no-warning-comments': ['error', { terms: ['@ts-ignore'], location: 'anywhere' }],
      'object-shorthand': 'error',
      'no-lonely-if': 'error',
      'no-else-return': 'error',
      radix: 'error',
      // Conventions the code already follows
      'no-var': 'error',
      'prefer-arrow-callback': 'error',
      'import-x/no-default-export': 'error',
      'import-x/no-commonjs': 'error',
      // Likely bugs, not reported by the shared config
      'array-callback-return': 'error',
      'no-template-curly-in-string': 'error',
      'no-throw-literal': 'error',
      'no-unused-expressions': 'error',
      // Custom camelcase rule with project-specific allowances
      camelcase: [
        'error',
        {
          allow: [
            '_lp$',
            'app_id',
            'addon_id',
            'orga_id',
            'app_name',
            'orga_name',
            'operator_id',
            'addon_name',
            'deploy_url',
            'git_ssh_url',
            'pretty_name',
            'org_id',
            'make_primary',
            'deployment_id',
          ],
        },
      ],
    },
  },
  {
    name: 'no-extraneous-dependencies',
    files: ['scripts/**/*.js', '.claude/hooks/*.js'],
    rules: {
      'import-x/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: true,
          optionalDependencies: false,
          peerDependencies: false,
        },
      ],
    },
  },
  {
    name: 'hashbang',
    files: ['bin/*.js', 'scripts/**/*.js', '.claude/hooks/*.js'],
    rules: {
      'n/hashbang': 'off',
    },
  },
];
