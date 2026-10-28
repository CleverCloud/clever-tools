import { build } from 'esbuild';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { getCurrentCommit } from './git.js';
import { getAssetPath } from './paths.js';

const ENTRY_POINT = fileURLToPath(new URL('../../bin/clever.js', import.meta.url));
// Only our own package.json carries the version to patch, dependencies can import theirs too
const ROOT_PACKAGE_JSON = fileURLToPath(new URL('../../package.json', import.meta.url));

/**
 * When distributing previews, we want to replace the version with the preview name
 * @param {string} version - The preview version
 * @param {string} commitId - The commit the preview is built from
 * @returns {import('esbuild').Plugin}
 */
function previewVersionPlugin(version, commitId) {
  return {
    name: 'preview-version',
    setup(esbuildBuild) {
      esbuildBuild.onLoad({ filter: /package\.json$/ }, async ({ path }) => {
        if (path !== ROOT_PACKAGE_JSON) {
          return undefined;
        }
        const packageData = JSON.parse(await fs.readFile(path, 'utf8'));
        packageData.version = `preview-${version}`;
        packageData.commitId = commitId;
        return { contents: JSON.stringify(packageData), loader: 'json' };
      });
    },
  };
}

/**
 * Bundle the whole project to a single CommonJS file with esbuild
 * @param {string} version - The version to build
 * @param {boolean} isPreview - Whether this is a preview build
 * @returns {Promise<void>}
 */
export async function bundleToSingleCjs(version, isPreview) {
  const outfile = getAssetPath('bundle', version, 'build');
  const plugins = isPreview ? [previewVersionPlugin(version, await getCurrentCommit())] : [];

  await build({
    entryPoints: [ENTRY_POINT],
    outfile,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    // esbuild empties `import.meta` in a CommonJS output, but some dependencies read `import.meta.url`
    // (it is also what pkg needs: `__filename` is the path of the file inside the binary)
    define: { 'import.meta.url': '__import_meta_url' },
    banner: { js: "'use strict';\nconst __import_meta_url = require('url').pathToFileURL(__filename).href;" },
    plugins,
    logLevel: 'warning',
  });
}
