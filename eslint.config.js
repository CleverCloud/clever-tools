import { cleverCloud } from '@clevercloud/eslint-config';
import { includeIgnoreFile } from '@eslint/compat';
import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import path from 'node:path';
import tseslint from 'typescript-eslint';

const gitignorePath = path.resolve('./.gitignore');

export default defineConfig([
  includeIgnoreFile(gitignorePath),
  {
    name: 'global config',
    ...cleverCloud.configs.node,
    files: ['bin/*.js', 'src/**/*.js', 'scripts/**/*.js', '**/*.ts', '.claude/hooks/*.js'],
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

  // TypeScript only: this block must come after the shared one, because `recommendedTypeChecked`
  // turns off core rules that TypeScript covers (`no-undef`, `no-unused-vars`...)
  {
    name: 'typescript rules',
    files: ['**/*.ts'],
    extends: [eslint.configs.recommended, tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        // Test files outside of `tsconfig.json` (which only lists the typed part of the code)
        projectService: { allowDefaultProject: ['src/models/*.test.ts'] },
      },
    },
    rules: {
      // Rewrites `./x.js` to `./x.ts` for `.ts` files, so imports of `.js` modules are reported as missing.
      // `npm run typecheck` already checks that imports resolve.
      'n/no-missing-import': 'off',
      // Enforce the use of 'import type' for importing types
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          fixStyle: 'inline-type-imports',
          disallowTypeAnnotations: false,
        },
      ],
      // Enforce the use of top-level import type qualifier when an import only has specifiers with inline type qualifiers
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/strict-boolean-expressions': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Use a string union type instead.',
        },
      ],
    },
  },
  {
    name: 'declaration files',
    files: ['**/*.d.ts'],
    rules: {
      // Parameter names in type signatures are not variables, and imports use `.js` specifiers for `.d.ts` files
      'no-unused-vars': 'off',
      'import-x/no-unresolved': 'off',
    },
  },
  // Tests run in Node, no restrictions
  {
    name: 'tests',
    files: ['**/*.test.ts'],
    rules: {
      'no-console': 'off',
      'no-restricted-globals': 'off',
      // `describe()` and `it()` of `node:test` return promises the runner tracks by itself
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
]);
