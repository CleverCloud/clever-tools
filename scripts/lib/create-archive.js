import fs from 'node:fs/promises';
import path from 'path';
import { getAssetParts } from './paths.js';
import { exec } from './process.js';

/**
 * Creates archives (specific version and optional "latest")
 * @param {string} version - The version to build
 * @param {'linux'|'macos'|'win'} os - The operating system
 * @param {boolean} createLatest - Whether to also create an archive for "latest"
 * @returns {Promise<void>}
 */
export async function createArchive(version, os, createLatest) {
  const archive = getAssetParts('archive', version, 'build', os);
  const binary = getAssetParts('binary', version, 'build', os);

  // Create specific version archive
  await createArchiveFromBinary(binary.directory, archive.directory, archive.filename, os);

  // Create "latest" archive if necessary
  if (createLatest) {
    const latestArchive = getAssetParts('archive', 'latest', 'build', os);
    const latestBinary = getAssetParts('binary', 'latest', 'build', os);

    // We need the "latest" binary directory structure
    await fs.mkdir(latestBinary.directory, { recursive: true });
    await fs.cp(`${binary.directory}/${binary.filename}`, `${latestBinary.directory}/${latestBinary.filename}`);

    await createArchiveFromBinary(latestBinary.directory, latestArchive.directory, latestArchive.filename, os);
  }
}

/**
 * Creates an archive with a directory inside
 * @param {string} directoryToArchive - The directory to archive
 * @param {string} archiveDirectory - The directory where the archive will be created
 * @param {string} archiveFilename - The filename of the archive to create
 * @param {'linux'|'macos'|'win'} os - The operating system
 * @returns {Promise<void>}
 */
async function createArchiveFromBinary(directoryToArchive, archiveDirectory, archiveFilename, os) {
  const relativeBinaryPath = path.relative(archiveDirectory, directoryToArchive);

  const command =
    os === 'win'
      ? `powershell -Command "Compress-Archive -DestinationPath ${archiveFilename} -Path ${relativeBinaryPath}"`
      : `tar czf ${archiveFilename} ${relativeBinaryPath}`;

  await exec(command, { cwd: archiveDirectory });
}
