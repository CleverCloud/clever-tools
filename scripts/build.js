import { exec as pkg } from 'pkg';
import * as cfg from './config.js';
import { getBinaryFilepath, getBinaryDirectory, getWorkingDirectory } from './paths.js';
import { startTask, endTask, cleanupDirectory, exec } from './utils.js';

export async function build (version) {
  await cleanupDirectory(getBinaryDirectory(version));

  const singleCjsScriptFilepath = getWorkingDirectory(version) + '/clever.cjs';

  await bundleToSingleCjsScript(singleCjsScriptFilepath);

  for (const arch of cfg.archList) {
    const binaryFilepath = getBinaryFilepath(arch, version);
    await buildBinary(arch, singleCjsScriptFilepath, binaryFilepath);
  }
};

// --- private

async function bundleToSingleCjsScript (singleCjsScriptFilepath) {
  startTask('Bundling project with rollup to single CJS script');
  await exec(`npm run build -- -o ${singleCjsScriptFilepath}`);
  endTask(`Bundling project with rollup to single CJS script to ${singleCjsScriptFilepath}`);
}

async function buildBinary (arch, sourceFilepath, binaryFilepath) {
  const { nodeVersion } = cfg;
  startTask(`Building binary for ${arch}`);
  await pkg([sourceFilepath, '-t', `node${nodeVersion}-${arch}`, '-o', binaryFilepath]);
  endTask(`Building binary for ${arch} to ${binaryFilepath}`);
}
