import { getCurrentCommit } from './git.js';
import { getAssetPath } from './paths.js';
import { exec } from './process.js';

/**
 * Bundle the whole project to a single CommonJS file with Rollup
 * @param {string} version - The version to build
 * @returns {Promise<void>}
 */
export async function bundleToSingleCjs(version) {
  const filename = getAssetPath('bundle', version, 'build');
  await exec(`npx rollup -c rollup.config.js -o ${filename}`, {
    env: {
      CLEVER_TOOLS_PREVIEW_VERSION: version,
      CLEVER_TOOLS_COMMIT_ID: await getCurrentCommit(),
    },
  });
}
