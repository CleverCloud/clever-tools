'use strict';

const cfg = require('./config');
const crypto = require('crypto');
const del = require('del');
const fs = require('fs-extra');
const path = require('path');
const { exec, applyTemplates } = require('./utils');

async function run () {

  const { archList, releasesDir, appInfos } = cfg;
  const version = cfg.getVersion();
  const isStableVersion = cfg.isStableVersion();

  del.sync([
    `${releasesDir}/${version}/*.deb`,
    `${releasesDir}/${version}/*.nupkg`,
    `${releasesDir}/${version}/*.rpm`,
    `${releasesDir}/${version}/*.sha256`,
    `${releasesDir}/${version}/*.tar.gz`,
    `${releasesDir}/${version}/*.zip`,
    `${releasesDir}/${version}/chocolatey`,
  ]);

  if (isStableVersion) {
    del.sync([
      `${releasesDir}/latest/*.sha256`,
      `${releasesDir}/latest/*.tar.gz`,
      `${releasesDir}/latest/*.zip`,
    ]);
  }

  for (let arch of archList) {
    // tar.gz and .zip
    const binaryFilepath = cfg.getBinaryFilepath(arch, version);
    const archiveFilepath = cfg.getArchiveFilepath(arch, version);
    await packageArchiveForArch({ binaryFilepath, archiveFilepath });
    const sha256 = await generateChecksumFile(archiveFilepath);
    if (isStableVersion) {
      const binaryFilepath = cfg.getBinaryFilepath(arch, 'latest');
      const archiveFilepath = cfg.getArchiveFilepath(arch, 'latest');
      await packageArchiveForArch({ binaryFilepath, archiveFilepath });
      await generateChecksumFile(archiveFilepath);
    }
    if (arch === 'linux') {
      // .rpm
      const rpmPath = cfg.getBundleFilepath('rpm', version);
      await packageLinuxBundle({ bundlePath: rpmPath, version, binaryFilepath, appInfos });
      await generateChecksumFile(rpmPath);
      // .deb
      const debPath = cfg.getBundleFilepath('deb', version);
      await packageLinuxBundle({ bundlePath: debPath, version, binaryFilepath, appInfos });
      await generateChecksumFile(debPath);
    }
    if (arch === 'win') {
      // nupkg
      const nupkgPath = cfg.getBundleFilepath('nupkg', version);
      await packageNupkg({ version, appInfos, sha256, releasesDir, archiveFilepath, nupkgPath });
      await generateChecksumFile(nupkgPath);
    }
  }
}

async function packageArchiveForArch ({ binaryFilepath, archiveFilepath }) {
  const { dir: dirToArchive } = path.parse(binaryFilepath);
  const { dir: parentDir } = path.parse(dirToArchive);
  const { ext: archiveExt } = path.parse(archiveFilepath);
  const relativeDirToArchive = path.relative(parentDir, dirToArchive);
  const relativeDirArchiveFilepath = path.relative(parentDir, archiveFilepath);
  if (archiveExt === '.zip') {
    await exec(`zip -r ${relativeDirArchiveFilepath} ${relativeDirToArchive}`, parentDir);
  }
  else {
    await exec(`tar czf ${relativeDirArchiveFilepath} ${relativeDirToArchive}`, parentDir);
  }
  console.log(`Packaging ${archiveFilepath} DONE!\n`);
}

async function packageLinuxBundle ({ bundlePath, version, binaryFilepath, appInfos }) {
  const { ext } = path.parse(bundlePath);
  const type = ext.slice(1);
  const { base: binaryFilename } = path.parse(binaryFilepath);
  console.log(`Packaging ${type} bundle ...`);
  await exec(`fpm \
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

async function packageNupkg ({ version, appInfos, sha256, releasesDir, archiveFilepath, nupkgPath }) {
  const templatesPath = './templates/choco';
  const destPath = `./${releasesDir}/${version}/chocolatey`;
  const relativeNupkgPath = path.relative(destPath, nupkgPath);
  const pkgVersion = version.replace('beta.', 'beta');
  await applyTemplates(destPath, templatesPath, {
    version,
    pkgVersion,
    sha256,
    ...appInfos,
  });
  await exec(`zip -r ${relativeNupkgPath} .`, destPath);
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
  return sum;
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
