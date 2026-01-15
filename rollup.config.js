import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { defineConfig } from 'rollup';

export default defineConfig({
  input: 'bin/clever.js',
  output: {
    format: 'cjs',
    inlineDynamicImports: true,
  },
  plugins: [
    // Rollup replaces "fileURLToPath(import.meta.url)"
    // with a dynamic require('u' + 'rl') and pkg does not like that very much
    // That's why we patch this
    {
      resolveImportMeta(property) {
        if (property === 'url') {
          return "require('url').pathToFileURL(__filename).href";
        }
      },
    },
    // When distributing previews, we want to replace the version with the preview name
    {
      transform(code, id) {
        if (
          id.includes('/package.json') &&
          process.env.CLEVER_TOOLS_PREVIEW_VERSION &&
          process.env.CLEVER_TOOLS_COMMIT_ID
        ) {
          const packageData = JSON.parse(code);
          packageData.version = `preview-${process.env.CLEVER_TOOLS_PREVIEW_VERSION}`;
          packageData.commitId = process.env.CLEVER_TOOLS_COMMIT_ID;
          return JSON.stringify(packageData);
        }
      },
    },
    // When building the CJS for the binary builds, we don't want to include "update-notifier"
    {
      transform(code, id) {
        if (id.endsWith('/bin/clever.js')) {
          return code.replace("import '../src/initial-update-notifier.js';", '');
        }
      },
    },
    commonjs(),
    nodeResolve({
      preferBuiltins: true,
      browser: false,
      exportConditions: ['node'],
    }),
    json(),
  ],
});
