import fs from 'node:fs';
import path from 'node:path';
import nodeSea from '@liudonghua123/node-sea';
import * as cfg from './config.js';
import { getBinaryDirectory, getBinaryFilepath, getWorkingDirectory } from './paths.js';
import { cleanupDirectory, endTask, exec, startTask } from './utils.js';

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
  const binaryDirectory = path.dirname(binaryFilepath);
  console.log({binaryDirectory});
  fs.mkdirSync(binaryDirectory, { recursive: true });



  const platform_mapping = {
    'win': 'windows',
    'linux': 'linux',
    'macos': 'macos',
  };

  await nodeSea(sourceFilepath, binaryFilepath, {
    useSystemNode: false,
    nodeVersion,
    arch: 'x64',
    withIntl: 'small-icu',
    platform: platform_mapping[arch],
  });
  endTask(`Building binary for ${arch} to ${binaryFilepath}`);
}
