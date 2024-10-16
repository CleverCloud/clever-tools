import * as cfg from './config.js';

const BUILD_DIR = 'build';

export function getWorkingDirectory (version) {
  return `${BUILD_DIR}/${version}`;
}

export function getBinaryDirectory (version) {
  return `${getWorkingDirectory(version)}/bin`;
}

export function getBinaryFilepath (arch, version) {
  return `${getBinaryDirectory(version)}/${getId(arch, version)}/${getBinaryFilename(arch)}`;
}

export function getBinaryLatestFilepath (arch, version) {
  return `${getBinaryDirectory(version)}/${getId(arch, 'latest')}/${getBinaryFilename(arch)}`;
}

function getBinaryFilename (arch) {
  return (arch === 'win') ? 'clever.exe' : 'clever';
}

export function getArchiveDirectory (version) {
  return `${getWorkingDirectory(version)}/archive`;
}

export function getArchiveFilepath (arch, version) {
  return `${getArchiveDirectory(version)}/${getArchiveFilename(arch, version)}`;
}

export function getArchiveLatestFilepath (arch, version) {
  return `${getArchiveDirectory(version)}/${getArchiveFilename(arch, 'latest')}`;
}

export function getArchiveFilename (arch, version) {
  const archiveExt = (arch === 'win') ? '.zip' : '.tar.gz';
  return `${getId(arch, version)}${archiveExt}`;
}

export function getBundleDirectory (version) {
  return `${getWorkingDirectory(version)}/bundle`;
}

export function getBundleFilepath (type, version) {
  return `${getBundleDirectory(version)}/${getBundleFilename(type, version)}`;
}

export function getBundleFilename (type, version) {
  return `${cfg.appInfos.name}-${version}.${type}`;
}

function getId (arch, version) {
  return `${cfg.appInfos.name}-${version}_${arch}`;
}

export function getShaFilepath (filepath) {
  return `${filepath}.sha256`;
}
