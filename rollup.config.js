import { defineConfig } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import MagicString from 'magic-string';

export default defineConfig({
  input: 'bin/clever.js',
  output: {
    file: 'build/clever.cjs',
    format: 'cjs',
    sourcemap: 'inline',
  },
  plugins: [
    {
      transform (code, id) {

        // formiable (used by superagent) hijacks require :-(
        if (id.includes('/node_modules/formidable/')) {
          const ms = new MagicString(code);
          ms.replaceAll(
            'if (global.GENTLY) require = GENTLY.hijack(require);',
            '',
          );
          return {
            code: ms.toString(),
            map: ms.generateMap(),
          };
        }

        // for update notifier
        if (id.includes('/node_modules/update-notifier/')) {
          const ms = new MagicString(code);
          ms
            .replaceAll(
              `const importLazy = require('import-lazy')(require);`,
              '',
            )
            .replaceAll(
              /const ([^ ]+) = importLazy\(\'([^']+)\'\);/g,
              'const $1_ = require(\'$2\'); const $1 = () => $1_',
            );

          return {
            code: ms.toString(),
            map: ms.generateMap(),
          };
        }

        // for ws peer deps
        if (id.includes('/node_modules/ws/')) {
          const ms = new MagicString(code);
          ms
            .replaceAll(
              'require(\'bufferutil\')',
              'null',
            )
            .replaceAll(
              'require(\'utf-8-validate\')',
              '{}',
            );

          return {
            code: ms.toString(),
            map: ms.generateMap(),
          };
        }
      },
    },
    commonjs(),
    nodeResolve({
      preferBuiltins: true,
    }),
    json(),
  ],
});
