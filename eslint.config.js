import { cleverCloud } from '@clevercloud/tooling-javascript-eslint-config';
import globals from 'globals';

export default [
  {
    ...cleverCloud.configs.node,
    files: ['bin/*.js', 'scripts/*.js', 'src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      camelcase: [
        'error',
        {
          allow: [
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
];
