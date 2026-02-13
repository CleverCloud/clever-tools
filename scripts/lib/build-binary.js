import pkg from '@yao-pkg/pkg';
import packageJson from '../../package.json' with { type: 'json' };
import { getAssetPath } from './paths.js';
import { highlight } from './terminal.js';

const PLATFORMS = {
  linux: 'linux',
  macos: 'macos',
  win: 'win',
};

const ARCHS = {
  linux: 'x64',
  macos: 'arm64',
  win: 'x64',
};

/**
 * Build a binary with @yao-pkg/pkg
 * @param {string} version - The version to build
 * @param {'linux'|'macos'|'win'} os - The operating system
 * @returns {Promise<void>}
 */
export async function buildBinary(version, os) {
  const input = getAssetPath('bundle', version, 'build');
  const output = getAssetPath('binary', version, 'build', os);

  const [nodeMajorVersion] = packageJson.volta.node.split('.');
  const platform = PLATFORMS[os];
  const arch = ARCHS[os];
  const target = `node${nodeMajorVersion}-${platform}-${arch}`;

  console.log(
    highlight`=> Build script ${input} into binary ${output} for ${platform}-${arch} with Node.js ${nodeMajorVersion}`,
  );

  await pkg.exec([input, '--target', target, '--output', output, '--options', 'use-system-ca']);
}
