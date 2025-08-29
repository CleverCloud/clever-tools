#!/usr/bin/env node
//
// Generate RPM and DEB packages using nfpm (goreleaser's packager).
//
// This script downloads the nfpm binary, processes package templates, and creates
// Linux distribution packages. RPM packages are GPG-signed during creation.
//
// USAGE: package-nfpm.js <version> <packager>
//
// ARGUMENTS:
//   version         Version string (e.g., "1.2.3")
//   packager        Package format to create ('rpm' or 'deb')
//
// ENVIRONMENT VARIABLES:
//   RPM_GPG_PRIVATE_KEY     RPM signing key
//   RPM_GPG_PASSPHRASE      RPM signing passphrase
//
// REQUIRED SYSTEM BINARIES:
//   tar             For extracting nfpm binary
//   chmod           For setting executable permissions
//
// EXAMPLES:
//   package-nfpm.js 1.2.3 rpm
//   package-nfpm.js 1.2.3 deb

import fs from 'node:fs/promises';
import { ArgumentError, readEnvVars, runCommand } from './lib/command.js';
import { getAssetPath } from './lib/paths.js';
import { exec } from './lib/process.js';
import { applyOneTemplate } from './lib/templates.js';
import { highlight } from './lib/terminal.js';

const NFPM_VERSION = '2.43.0';
const NFPM_URL = `https://github.com/goreleaser/nfpm/releases/download/v${NFPM_VERSION}/nfpm_${NFPM_VERSION}_Linux_x86_64.tar.gz`;
const NFPM_BINARY_PATH = '/tmp/nfpm';

runCommand(async () => {
  const [version, packager] = process.argv.slice(2);
  if (version == null) {
    throw new ArgumentError('version');
  }
  if (packager == null) {
    throw new ArgumentError('packager');
  }
  if (packager !== 'rpm' && packager !== 'deb') {
    throw new ArgumentError('packager', ['rpm', 'deb']);
  }

  const [rpmGpgPrivateKey, rpmGpgPassphrase] =
    packager === 'rpm' ? readEnvVars(['RPM_GPG_PRIVATE_KEY', 'RPM_GPG_PASSPHRASE']) : [];

  const arch = packager === 'rpm' ? 'x86_64' : 'amd64';
  const templatePath = `/tmp/nfpm-${packager}.yaml`;
  const outputPath = getAssetPath(packager, version, 'build');

  // Check if nfpm binary already exists
  try {
    await fs.access(NFPM_BINARY_PATH);
    console.log(highlight`=> Using existing nfpm binary at ${NFPM_BINARY_PATH}`);
  } catch {
    console.log(highlight`=> Downloading nfpm ${NFPM_VERSION}`);
    const response = await fetch(NFPM_URL);
    if (!response.ok) {
      throw new Error(`Failed to download nfpm: ${response.statusText}`);
    }

    const tarData = new Uint8Array(await response.arrayBuffer());
    await fs.writeFile('/tmp/nfpm.tar.gz', tarData);

    console.log(highlight`=> Extracting nfpm binary`);
    await exec('tar -xzf /tmp/nfpm.tar.gz nfpm', { cwd: '/tmp' });
    await exec(`chmod +x ${NFPM_BINARY_PATH}`);
  }

  await applyOneTemplate(templatePath, './scripts/templates/nfpm.yml', {
    version,
    arch,
  });

  if (packager === 'rpm') {
    console.log(highlight`=> Writing GPG signing key to ${'/tmp/signing-key.asc'}`);
    await fs.writeFile('/tmp/signing-key.asc', rpmGpgPrivateKey);
  }

  await exec(`${NFPM_BINARY_PATH} package --config ${templatePath} --packager ${packager} --target ${outputPath}`, {
    env: {
      NFPM_RPM_PASSPHRASE: rpmGpgPassphrase,
    },
  });

  console.log(highlight`=> ${packager.toUpperCase()} package created: ${outputPath}`);
});
