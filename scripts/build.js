const { exec: pkg } = require('pkg');
const cfg = require('./config.js');
const {
  getBinaryFilepath,
  getBinaryDirectory,
} = require('./paths.js');
const {
  startTask,
  endTask,
  cleanupDirectory,
} = require('./utils.js');

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
