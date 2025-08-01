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
