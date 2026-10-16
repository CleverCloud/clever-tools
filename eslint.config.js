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
    files: ['bin/*.js', 'src/**/*.js', 'scripts/**/*.js'],
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
      // TODO: existing violations, fixed in the next commits
      curly: 'off',
      'no-unused-vars': 'off',
      'no-useless-escape': 'off',
      'no-undef': 'off',
      'no-case-declarations': 'off',
      'no-constant-binary-expression': 'off',
      eqeqeq: 'off',
      'import-x/no-named-as-default': 'off',
      'import-x/no-useless-path-segments': 'off',
      'import-x/extensions': 'off',
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
    files: ['scripts/**/*.js'],
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
    files: ['bin/*.js', 'scripts/**/*.js'],
    rules: {
      'n/hashbang': 'off',
    },
  },
];
