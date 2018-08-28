'use strict';

const cfg = require('./config');
const crypto = require('crypto');
const del = require('del');
const exec = require('child_process').exec;
const fs = require('fs-extra');
const path = require('path');

async function run () {

  const { archList, releasesDir, appInfos } = cfg;
  const version = cfg.getVersion();

  del.sync(`${releasesDir}/${version}/*.*`);

  for (let arch of archList) {
    // tar.gz and .zip
    const binaryFilepath = cfg.getBinaryFilepath(arch);
    const archiveFilepath = cfg.getArchiveFilepath(arch);
    await packageArchiveForArch({ binaryFilepath, archiveFilepath });
    await generateChecksumFile(archiveFilepath);
    if (arch === 'linux') {
      // .rpm
      const rpmPath = cfg.getBundleFilepath('rpm');
      await packageLinuxBundle({ bundlePath: rpmPath, version, binaryFilepath, appInfos });
      await generateChecksumFile(rpmPath);
      // .deb
      const debPath = cfg.getBundleFilepath('deb');
      await packageLinuxBundle({ bundlePath: debPath, version, binaryFilepath, appInfos });
      await generateChecksumFile(debPath);
    }
  }
}

async function packageArchiveForArch ({ binaryFilepath, archiveFilepath }) {
  const { ext: archiveExt } = path.parse(archiveFilepath);
  const { dir: binaryDir, base: filename } = path.parse(binaryFilepath);
  console.log(`Packaging ${archiveFilepath} ...`);
  if (archiveExt === '.zip') {
    await asyncExec(`zip -j ${archiveFilepath} ${binaryFilepath}`);
  }
  else {
    await asyncExec(`tar czf "${archiveFilepath}" -C ${binaryDir} ${filename}`);
  }
  console.log(`Packaging ${archiveFilepath} DONE!\n`);
}

function asyncExec (command) {
  console.log(`Executing command: ${command}`);
  return new Promise((resolve, reject) => {
    exec(command, (err) => err ? reject(err) : resolve());
  });
}

async function packageLinuxBundle ({ bundlePath, version, binaryFilepath, appInfos }) {
  const { ext } = path.parse(bundlePath);
  const type = ext.slice(1);
  const { base: binaryFilename } = path.parse(binaryFilepath);
  console.log(`Packaging ${type} bundle ...`);
  await asyncExec(`fpm \
    -s dir \
    -t ${type} \
    -p "${bundlePath}" \
    -n "${appInfos.name}" \
    --vendor "${appInfos.vendor}" \
    --description "${appInfos.description}" \
    --url "${appInfos.url}" \
    --license "${appInfos.license}" \
    -v ${version} \
    ${binaryFilepath}=/usr/bin/${binaryFilename}`);
  console.log(`Packaging ${type} bundle DONE!\n`);
  return bundlePath;
}

async function generateChecksumFile (filepath) {
  console.log(`Generating checksum file for ${filepath} ...`);
  const sum = await new Promise((resolve, reject) => {
    const shasum = crypto.createHash('sha256');
    const stream = fs.ReadStream(filepath);
    stream.on('data', (d) => shasum.update(d));
    stream.on('end', () => resolve(shasum.digest('hex')));
    stream.on('error', reject);
  });
  await fs.outputFile(`${filepath}.sha256`, sum);
  console.log(`Generating checksum file for ${filepath} DONE!\n`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
