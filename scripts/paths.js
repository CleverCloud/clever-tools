const cfg = require('./config.js');

const BUILD_DIR = 'build';

function getWorkingDirectory (version) {
  return `${BUILD_DIR}/${version}`;
}

function getBinaryDirectory (version) {
  return `${getWorkingDirectory(version)}/bin`;
}

function getBinaryFilepath (arch, version) {
  return `${getBinaryDirectory(version)}/${getId(arch, version)}/${getBinaryFilename(arch)}`;
}

function getBinaryLatestFilepath (arch, version) {
  return `${getBinaryDirectory(version)}/${getId(arch, 'latest')}/${getBinaryFilename(arch)}`;
}

function getBinaryFilename (arch) {
  return (arch === 'win') ? 'clever.exe' : 'clever';
}

function getArchiveDirectory (version) {
  return `${getWorkingDirectory(version)}/archive`;
}

function getArchiveFilepath (arch, version) {
  return `${getArchiveDirectory(version)}/${getArchiveFilename(arch, version)}`;
}

function getArchiveLatestFilepath (arch, version) {
  return `${getArchiveDirectory(version)}/${getArchiveFilename(arch, 'latest')}`;
}

function getArchiveFilename (arch, version) {
  const archiveExt = (arch === 'win') ? '.zip' : '.tar.gz';
  return `${getId(arch, version)}${archiveExt}`;
}

function getBundleDirectory (version) {
  return `${getWorkingDirectory(version)}/bundle`;
}

function getBundleFilepath (type, version) {
  return `${getBundleDirectory(version)}/${getBundleFilename(type, version)}`;
}

function getBundleFilename (type, version) {
  return `${cfg.appInfos.name}-${version}.${type}`;
}

function getId (arch, version) {
  return `${cfg.appInfos.name}-${version}_${arch}`;
}

function getShaFilepath (filepath) {
  return `${filepath}.sha256`;
}

module.exports = {
  getWorkingDirectory,
  getBinaryDirectory,
  getBinaryFilepath,
  getBinaryLatestFilepath,
  getArchiveDirectory,
  getArchiveFilepath,
  getArchiveLatestFilepath,
  getArchiveFilename,
  getBundleDirectory,
  getBundleFilepath,
  getBundleFilename,
  getShaFilepath,
};
