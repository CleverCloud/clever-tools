import path from 'node:path';
import * as cfg from './config.js';
import { getCellarClient } from './cellar-client.js';
import { getArchiveFilepath, getShaFilepath, getArchiveLatestFilepath, getBundleFilepath, getBundleFilename } from './paths.js';

const { archList } = cfg;
const bundlesList = ['rpm', 'deb', 'nupkg'];

export async function publishCellar (version) {
  const cellarClient = getCellarClient('releases');

  for (const file of getFilesToCopy(version)) {
    await cellarClient.upload(file.src, file.dest);
  }
}

function getFilesToCopy (version) {

  const withSha = (o) => [o, { src: getShaFilepath(o.src), dest: getShaFilepath(o.dest) }];

  const archives = archList.flatMap((arch) => {
    const archiveFilepath = getArchiveFilepath(arch, version);
    const archiveLatestFilepath = getArchiveLatestFilepath(arch, version);

    return [
      ...withSha({
        src: archiveFilepath,
        dest: getRemoteFilepath(archiveFilepath, version),
      }),
      ...withSha({
        src: archiveLatestFilepath,
        dest: getRemoteFilepath(archiveLatestFilepath, 'latest'),
      }),
    ];
  });

  const bundles = bundlesList.flatMap((type) => {
    const bundleFilepath = getBundleFilepath(type, version);

    return [
      ...withSha({
        src: bundleFilepath,
        dest: getRemoteFilepath(bundleFilepath, version),
      }),
      ...withSha({
        src: bundleFilepath,
        dest: getRemote(getBundleFilename(type, 'latest'), 'latest'),
      }),
    ];
  });

  return [...archives, ...bundles];
}

function getRemoteFilepath (filepath, version) {
  const { base: filename } = path.parse(filepath);
  return getRemote(filename, version);
}

function getRemote (filename, version) {
  return `releases/${version}/${filename}`;
}

export async function assertRemoteFilesAreOnCellar (version) {
  const cellarClient = getCellarClient('releases');

  for (const file of getFilesToCopy(version)) {
    if (!await cellarClient.exists(file.dest)) {
      throw new Error(`${file.dest} is not present on Cellar`);
    }
  }
}
