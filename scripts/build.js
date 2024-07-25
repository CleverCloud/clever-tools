import { exec as pkg } from 'pkg';
import * as cfg from './config.js';
import { getBinaryFilepath, getBinaryDirectory } from './paths.js';
import { startTask, endTask, cleanupDirectory } from './utils.js';

module.exports = async function build (version) {
  await cleanupDirectory(getBinaryDirectory(version));

  for (const arch of cfg.archList) {
    const binaryFilepath = getBinaryFilepath(arch, version);
    await buildBinary(arch, binaryFilepath);
  }
};

// --- private

async function buildBinary (arch, binaryFilepath) {
  const { nodeVersion } = cfg;
  startTask(`Building binary for ${arch}`);
  await pkg(['.', '-t', `node${nodeVersion}-${arch}`, '-o', binaryFilepath]);
  endTask(`Building binary for ${arch} to ${binaryFilepath}`);
}
