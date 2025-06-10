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
  // This dependency is only pulled in when building on MacOS (see https://github.com/CleverCloud/clever-tools/issues/864)
  // It's a binary file and it shouldn't be parsed by rollup, only copied.
  // We exclude it from the bundle because it's a dependency that is pulled by `curlconverter` but we don't actually need it.
  external: ['fsevents'],
  plugins: [
    {
      transform (code, id) {

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
