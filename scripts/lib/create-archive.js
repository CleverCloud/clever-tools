import path from 'path';
import { getAssetParts } from './paths.js';
import { exec } from './process.js';

/**
 * Creates an archive with the binary
 * @param {string} version - The version to build
 * @param {'linux'|'macos'|'win'} os - The operating system
 * @returns {Promise<void>}
 */
export async function createArchive(version, os) {
  const archive = getAssetParts('archive', version, 'build', os);
  const binary = getAssetParts('binary', version, 'build', os);
  const relativeBinaryPath = path.relative(archive.directory, binary.directory);

  const command =
    os === 'win'
      ? `powershell -Command "Compress-Archive -DestinationPath ${archive.filename} -Path ${relativeBinaryPath}"`
      : `tar czf ${archive.filename} ${relativeBinaryPath}`;

  await exec(command, { cwd: archive.directory });
}
