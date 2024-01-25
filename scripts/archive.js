const fs = require('fs-extra');
const path = require('path');
const cfg = require('./config.js');
const {
  getArchiveFilepath,
  getArchiveDirectory,
  getBinaryFilepath, getArchiveLatestFilepath, getBinaryLatestFilepath,
} = require('./paths.js');
const {
  generateChecksumFile,
  startTask,
  endTask,
  exec,
  cleanupDirectory,
  assertFileExists,
} = require('./utils.js');

module.exports = async function build (version, latest) {
  await cleanupDirectory(getArchiveDirectory(version));

  for (const arch of cfg.archList) {
    const binaryFilepath = getBinaryFilepath(arch, version);

    await assertFileExists(binaryFilepath);

    const archiveFilepath = getArchiveFilepath(arch, version);
    await packageArchive(binaryFilepath, archiveFilepath);
    await generateChecksumFile(archiveFilepath);

    if (latest) {
      const binaryLatestFilepath = getBinaryLatestFilepath(arch, version);
      await fs.copy(binaryFilepath, binaryLatestFilepath);
      const archiveLatestFilepath = getArchiveLatestFilepath(arch, version);
      await packageArchive(binaryLatestFilepath, archiveLatestFilepath);
      await generateChecksumFile(archiveLatestFilepath);
    }
  }
}

//--- private

async function packageArchive (binaryFilepath, archiveFilepath) {
  startTask(`Packaging ${archiveFilepath}`);

  const { ext: archiveExt } = path.parse(archiveFilepath);
  const { dir: dirToBinary } = path.parse(binaryFilepath);
  const { dir: dirToArchive } = path.parse(archiveFilepath);
  const { dir: workDir } = path.parse(dirToBinary);
  const relativeDirToBinary = path.relative(workDir, dirToBinary);
  const relativeDirArchiveFilepath = path.relative(workDir, archiveFilepath);

  fs.mkdirs(dirToArchive);

  if (archiveExt === '.zip') {
    await exec(`zip -r ${relativeDirArchiveFilepath} ${relativeDirToBinary}`, workDir);
  }
  else {
    await exec(`tar czf ${relativeDirArchiveFilepath} ${relativeDirToBinary}`, workDir);
  }
  endTask(`Packaging ${archiveFilepath}`);
}
