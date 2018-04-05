'use strict'

const AWS = require('aws-sdk')
const crypto = require('crypto')
const del = require('del')
const exec = require('child_process').exec
const fs = require('fs-extra')
const pkg = require('pkg').exec
const platform = require('os').platform()
const request = require('request')

const applicationName = 'clever-tools'
const applicationVendor = 'Clever Cloud'
const applicationDescription = 'Command Line Interface for Clever Cloud.'
const license = 'MIT'
const applicationUrl = 'https://www.clever-cloud.com/'

const nodeVersion = process.versions.node
const cleverToolsVersion = process.env.GIT_TAG_NAME || 'master'
const releasesDir = 'releases'
const scriptsDir = 'scripts'

const accessKeyId = process.env.S3_KEY_ID
const secretAccessKey = process.env.S3_SECRET_KEY
const cellarHost = 'cellar.services.clever-cloud.com'
const s3Bucket = 'clever-tools'

const bintrayUser = process.env.BINTRAY_USER
const bintrayApiKey = process.env.BINTRAY_API_KEY
const bintrayAuth = Buffer.from(`${bintrayUser}:${bintrayApiKey}`).toString('base64')
const bintrayRpmPackage = process.env.BINTRAY_RPM_PACKAGE
const bintrayDebPackage = process.env.BINTRAY_DEB_PACKAGE

AWS.config.update({ accessKeyId, secretAccessKey })
const s3 = new AWS.S3({
  endpoint: new AWS.Endpoint(cellarHost),
  signatureVersion: 'v2',
})

function asyncExec (command) {
  console.log(`Executing command: ${command}`)
  return new Promise((resolve, reject) => {
    exec(command, (err) => err ? reject(err) : resolve())
  })
}

async function checksum (file) {
  return new Promise((resolve, reject) => {
    const shasum = crypto.createHash('sha256')
    const stream = fs.ReadStream(file)
    stream.on('data', (d) => shasum.update(d))
    stream.on('end', () => resolve(shasum.digest('hex')))
    stream.on('error', reject)
  })
}

function uploadBintray(filepath, dest) {
  return new Promise((resolve, reject) => {
    console.log(`Uploading file ${filepath} to ${dest}`)
    request.put({
      url: `https://api.bintray.com/content/${dest}?publish=1`,
      formData: {
        file: fs.createReadStream(filepath),
      },
      headers: {
        'Authorization': `Basic ${bintrayAuth}`,
        // Mandatory specifications for debian
        'X-Bintray-Debian-Distribution': 'wheezy',
        'X-Bintray-Debian-Component': 'main',
        'X-Bintray-Debian-Architecture': 'i386,amd64'
      }
    }, (err, res) => err ? reject(err) : resolve(res))
  })
}

function uploadFile (filepath, remoteFilepath = filepath) {
  return fs.readFile(filepath).then((Body) => {
    console.log(`Uploading file ${filepath} to ${remoteFilepath}`)
    return new Promise((resolve, reject) => {
      const params = { ACL: 'public-read', Body, Bucket: s3Bucket, Key: remoteFilepath }
      return s3.putObject(params, (err) => err ? reject(err) : resolve())
    })
  })
}


async function buildRelease (arch) {

  console.log(`Building release for ${arch}...\n`)

  const cleverTools = (arch === 'win') ? `clever.exe` : 'clever'
  const archiveExt = (arch === 'win') ? '.zip' : '.tar.gz'
  const buildDir = `${releasesDir}/${cleverToolsVersion}`
  const archivePath = `${buildDir}/clever-tools-${cleverToolsVersion}_${arch}${archiveExt}`
  const latestArchivePath = `${releasesDir}/latest/clever-tools-latest_${arch}${archiveExt}`

  await pkg([`.`, `-t`, `node${nodeVersion}-${arch}`, `-o`, `${buildDir}/${arch}/${cleverTools}`])

  // special case when building linux release on a linux system
  // we're using the "nodegit.node" we just built
  // it should fix the bad libcurl problem https://github.com/nodegit/nodegit/issues/1225
  if (arch === 'linux' && platform === 'linux') {
    fs.copy(`node_modules/nodegit/build/Release/nodegit.node`, `${buildDir}/${arch}/nodegit.node`)
  }
  else {
    fs.copy(`nodegit/${arch}-nodegit.node`, `${buildDir}/${arch}/nodegit.node`)
  }

  if (arch === 'win') {
    await asyncExec(`zip -j ${archivePath} ${buildDir}/${arch}/${cleverTools} ${buildDir}/${arch}/nodegit.node`)
  }
  else {
    await asyncExec(`tar czf "${archivePath}" -C ${buildDir}/${arch} ${cleverTools} nodegit.node`)
  }

  if (arch === 'linux') {
    await buildRpm(buildDir)
    await buildDeb(buildDir)
  }

  await del(`${buildDir}/${arch}`)

  const sum = await checksum(`${archivePath}`)
  await fs.outputFile(`${archivePath}.sha256`, sum)
  await fs.appendFile(`${releasesDir}/sha.properties`, `SHA256_${arch}=${sum}\n`)

  if (cleverToolsVersion !== 'master') {
    if (!process.env.S3_KEY_ID || !process.env.S3_SECRET_KEY) {
      throw new Error('Could not read S3 access/secret keys!')
    }
    const filename = `clever-tools-${cleverToolsVersion}`
    await Promise.all([
      uploadFile(`${archivePath}`),
      uploadFile(`${archivePath}.sha256`),
      uploadFile(`${archivePath}`, `${latestArchivePath}`),
      uploadFile(`${archivePath}.sha256`, `${latestArchivePath}.sha256`),
      uploadFile(`${buildDir}/${filename}.rpm`),
      uploadBintray(`${buildDir}/${filename}.rpm`, `${bintrayRpmPackage}/${cleverToolsVersion}/${filename}.rpm`),
      uploadFile(`${buildDir}/${filename}.rpm.sha256`),
      uploadFile(`${buildDir}/${filename}.deb`),
      uploadBintray(`${buildDir}/${filename}.deb`, `${bintrayDebPackage}/${cleverToolsVersion}/${filename}.deb`),
      uploadFile(`${buildDir}/${filename}.deb.sha256`)
    ])
  }

  console.log(`\nRelease BUILT! ${archivePath}\n`)
}

async function buildRpm(buildDir) {
  console.log("Building RPM package...\n")

  const packagePath = `${buildDir}/clever-tools-${cleverToolsVersion}.rpm`

  await asyncExec(`fpm \
    -s dir \
    -t rpm \
    -p "${packagePath}" \
    -n "${applicationName}" \
    --vendor "${applicationVendor}" \
    --description "${applicationDescription}" \
    --license "${license}" \
    -v ${cleverToolsVersion} \
    -d "libssh2" \
    -d "libcurl" \
    ${buildDir}/linux/clever=/usr/lib/clever-tools-bin/clever \
    ${buildDir}/linux/nodegit.node=/usr/lib/clever-tools-bin/nodegit.node \
    ${scriptsDir}/clever-wrapper.sh=/usr/bin/clever`)

  const sum = await checksum(`${packagePath}`)
  await fs.outputFile(`${packagePath}.sha256`, sum)
  await fs.appendFile(`${releasesDir}/sha.properties`, `SHA256_rpm=${sum}\n`)

  console.log(`\nRPM BUILT ! ${buildDir}/clever-tools-${cleverToolsVersion}.rpm\n`)
}

async function buildDeb(buildDir) {
  console.log("Building DEB package...\n")

  const packagePath = `${buildDir}/clever-tools-${cleverToolsVersion}.deb`

  await asyncExec(`fpm \
    -s dir \
    -t deb \
    -p "${buildDir}/clever-tools-${cleverToolsVersion}.deb" \
    -n "${applicationName}" \
    --vendor "${applicationVendor}" \
    --description "${applicationDescription}" \
    --license "${license}" \
    -v ${cleverToolsVersion} \
    -d "libssh2-1" \
    -d "libcurl3-gnutls" \
    ${buildDir}/linux/clever=/usr/lib/clever-tools-bin/clever \
    ${buildDir}/linux/nodegit.node=/usr/lib/clever-tools-bin/nodegit.node \
    ${scriptsDir}/clever-wrapper.sh=/usr/bin/clever`)

  const sum = await checksum(`${packagePath}`)
  await fs.outputFile(`${packagePath}.sha256`, sum)
  await fs.appendFile(`${releasesDir}/sha.properties`, `SHA256_rpm=${sum}\n`)

  console.log(`\nDEB BUILT ! ${buildDir}/clever-tools-${cleverToolsVersion}.deb\n`)
}

console.log(`Building releases for cc-tools@${cleverToolsVersion} with node v${nodeVersion}\n`)

del.sync(releasesDir)

Promise.resolve()
  .then(() => buildRelease('linux'))
  .then(() => buildRelease('macos'))
  .then(() => buildRelease('win'))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
