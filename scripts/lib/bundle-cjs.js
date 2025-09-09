import { getCurrentCommit } from './git.js';
import { getAssetPath } from './paths.js';
import { exec } from './process.js';

/**
 * Bundle the whole project to a single CommonJS file with Rollup
 * @param {string} version - The version to build
 * @param {boolean} isPreview - Whether this is a preview build
 * @returns {Promise<void>}
 */
export async function bundleToSingleCjs(version, isPreview) {
  const filename = getAssetPath('bundle', version, 'build');
  const env = {};
  if (isPreview) {
    env.CLEVER_TOOLS_PREVIEW_VERSION = version;
    env.CLEVER_TOOLS_COMMIT_ID = await getCurrentCommit();
  }
  await exec(`npx rollup -c rollup.config.js -o ${filename}`, { env });
}
