'use strict';

const cfg = require('./config');
const crypto = require('crypto');
const del = require('del');
const fs = require('fs-extra');
const path = require('path');
const { startTask, endTask, exec, applyTemplates, writeStringToFile } = require('./utils');

async function run () {

  const { archList, releasesDir, appInfos } = cfg;
  const version = cfg.getVersion();
  const isStableVersion = cfg.isStableVersion();
  const { gpgPrivateKey, gpgPath, gpgName, gpgPass } = cfg.getGpgConf();
  // if no private key is found, do not try to sign package.
  const signPackage = gpgPrivateKey ? true:false;

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
  if (signPackage){
    await prepareGpg({gpgPrivateKey, gpgPath, gpgName, gpgPass});
  }

  for (const arch of archList) {
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
      await packageLinuxBundle({ bundlePath: rpmPath, version, binaryFilepath, appInfos, signPackage });
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
  startTask(`Packaging ${archiveFilepath}`);
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
  endTask(`Packaging ${archiveFilepath}`);
}

async function prepareGpg({gpgPrivateKey, gpgPath, gpgName, gpgPass}){
  startTask(`Preparing GPG`);
  const templatesPath = './templates/gpg';
  const destPath = `${gpgPath}`;
  await writeStringToFile(gpgPrivateKey,'/tmp/GPG-PRIVATE-KEY-Clever-Cloud')
  await applyTemplates(destPath, templatesPath, {
    gpgPath,
    gpgName,
    gpgPass
  });
  // import private/public key in GPG
  await exec(`gpg --batch --import /tmp/GPG-PRIVATE-KEY-Clever-Cloud`);
  // export key in file
  await exec(`gpg --export -a "${gpgName}" > /tmp/RPM-GPG-KEY-Clever-Cloud`);
  // import key in rpm
  await exec(`rpm --import /tmp/RPM-GPG-KEY-Clever-Cloud`);
  // cleanup temporary files
  await exec(`rm -f /tmp/RPM-GPG-PRIVATE-KEY-Clever-Cloud`);
  await exec(`rm -f /tmp/RPM-GPG-KEY-Clever-Cloud`);
  console.log(`GPG configuration ready in ${gpgPath}`);
  endTask(`Preparing GPG`);
}

async function packageLinuxBundle ({ bundlePath, version, binaryFilepath, appInfos, signPackage }) {
  const { ext } = path.parse(bundlePath);
  const type = ext.slice(1);
  startTask(`Packaging Linux ${type}`);
  const { base: binaryFilename } = path.parse(binaryFilepath);
  let signFlag=''
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
  if (type === 'rpm' && signPackage === true){
    await exec(`rpm --addsign ${bundlePath}`);
  }
  endTask(`Packaging Linux ${type}`);
  return bundlePath;
}

async function packageNupkg ({ version, appInfos, sha256, releasesDir, archiveFilepath, nupkgPath }) {
  startTask(`Packaging Nupkg (chocolatey)`);
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
  endTask(`Packaging Nupkg (chocolatey)`);
}

async function generateChecksumFile (filepath) {
  startTask(`Generating checksum file for ${filepath}`,'');
  const sum = await new Promise((resolve, reject) => {
    const shasum = crypto.createHash('sha256');
    const stream = fs.ReadStream(filepath);
    stream.on('data', (d) => shasum.update(d));
    stream.on('end', () => resolve(shasum.digest('hex')));
    stream.on('error', reject);
  });
  await fs.outputFile(`${filepath}.sha256`, sum);
  endTask('','\n\n');
  return sum;
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
