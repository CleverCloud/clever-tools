const path = require('path');
const { readFile } = require('fs/promises');
const cfg = require('./config.js');
const {
  startTask,
  writeStringToFile,
  applyTemplates,
  exec,
  endTask,
  generateChecksumFile,
  assertFileExists,
  cleanupDirectory,
} = require('./utils.js');
const {
  getBinaryFilepath,
  getArchiveFilepath,
  getShaFilepath,
  getBundleDirectory,
  getBundleFilepath,
} = require('./paths.js');

module.exports = async function bundle (version) {
  await cleanupDirectory(getBundleDirectory(version));

  for (const arch of cfg.archList) {
    if (arch === 'linux') {
      await bundleRpm(version);
      await bundleDeb(version);
    }
    if (arch === 'win') {
      await bundleNupkg(version);
    }
  }
};

// --- private

async function bundleRpm (version) {
  const bundleType = 'rpm';
  const { appInfos } = cfg;
  const binaryFilepath = getBinaryFilepath('linux', version);

  // verify files to bundle are ready
  await assertFileExists(binaryFilepath);

  // bundle package
  const bundlePath = getBundleFilepath(bundleType, version);
  await packageLinuxBundle({ bundleType, bundlePath, version, binaryFilepath, appInfos });

  // sign package if a private key is found
  const { gpgPrivateKey, gpgPath, gpgName, gpgPass } = cfg.getGpgConf();
  if (gpgPrivateKey != null) {
    await prepareGpg({ gpgPrivateKey, gpgPath, gpgName, gpgPass });
    await exec(`rpm --addsign ${bundlePath}`);
  }

  // generate checksum
  await generateChecksumFile(bundlePath);
}

async function bundleDeb (version) {
  const bundleType = 'deb';
  const { appInfos } = cfg;
  const binaryFilepath = getBinaryFilepath('linux', version);

  // verify files to bundle are ready
  await assertFileExists(binaryFilepath);

  // bundle package
  const bundlePath = getBundleFilepath(bundleType, version);
  await packageLinuxBundle({ bundleType, bundlePath, version, binaryFilepath, appInfos });

  // generate checksum
  await generateChecksumFile(bundlePath);
}

async function bundleNupkg (version) {
  const { appInfos } = cfg;
  const shaFilepath = getShaFilepath(getArchiveFilepath('win', version));

  startTask('Packaging Nupkg (chocolatey)');
  const sha256 = await readFile(shaFilepath);
  const nupkgPath = getBundleFilepath('nupkg', version);
  const templatesPath = './templates/choco';
  const destPath = `${getBundleDirectory(version)}/chocolatey`;
  const relativeNupkgPath = path.relative(destPath, nupkgPath);
  await applyTemplates(destPath, templatesPath, {
    version,
    sha256,
    ...appInfos,
  });
  await exec(`zip -r ${relativeNupkgPath} .`, destPath);
  endTask('Packaging Nupkg (chocolatey)');

  // generate checksum
  await generateChecksumFile(nupkgPath);
}

async function prepareGpg ({ gpgPrivateKey, gpgPath, gpgName, gpgPass }) {
  startTask('Preparing GPG');
  const templatesPath = './templates/gpg';
  const destPath = `${gpgPath}`;
  await writeStringToFile(gpgPrivateKey, '/tmp/GPG-PRIVATE-KEY-Clever-Cloud');
  await applyTemplates(destPath, templatesPath, {
    gpgPath,
    gpgName,
    gpgPass,
  });
  // import private/public key in GPG
  await exec('gpg --batch --import /tmp/GPG-PRIVATE-KEY-Clever-Cloud');
  // export key in file
  await exec(`gpg --export -a "${gpgName}" > /tmp/RPM-GPG-KEY-Clever-Cloud`);
  // import key in rpm
  await exec('rpm --import /tmp/RPM-GPG-KEY-Clever-Cloud');
  // cleanup temporary files
  await exec('rm -f /tmp/RPM-GPG-PRIVATE-KEY-Clever-Cloud');
  await exec('rm -f /tmp/RPM-GPG-KEY-Clever-Cloud');
  console.log(`GPG configuration ready in ${gpgPath}`);
  endTask('Preparing GPG');
}

async function packageLinuxBundle ({ bundleType, bundlePath, version, binaryFilepath, appInfos }) {
  startTask(`Packaging Linux ${bundleType}`);
  const { base: binaryFilename } = path.parse(binaryFilepath);
  await exec(`fpm \
    -s dir \
    -t ${bundleType} \
    -p "${bundlePath}" \
    -n "${appInfos.name}" \
    --vendor "${appInfos.vendor}" \
    --description "${appInfos.description}" \
    --url "${appInfos.url}" \
    --license "${appInfos.license}" \
    -v ${version} \
    ${binaryFilepath}=/usr/bin/${binaryFilename}`);
  endTask(`Packaging Linux ${bundleType}`);
}
