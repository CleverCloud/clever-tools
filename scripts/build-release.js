'use strict'

const AWS = require('aws-sdk')
const crypto = require('crypto')
const del = require('del')
const exec = require('child_process').exec
const fs = require('fs-extra')
const pkg = require('pkg').exec

const nodeVersion = process.versions.node
const cleverToolsVersion = process.env.GIT_TAG_NAME || 'master'
const releasesDir = 'releases'

const accessKeyId = process.env.S3_KEY_ID
const secretAccessKey = process.env.S3_SECRET_KEY
const cellarHost = 'cellar.services.clever-cloud.com'
const s3Bucket = 'clever-tools'

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

function uploadFile (filepath) {
  return fs.readFile(filepath).then((Body) => {
    console.log(`Uploading file ${filepath}`)
    return new Promise((resolve, reject) => {
      const params = { ACL: 'public-read', Body, Bucket: s3Bucket, Key: filepath }
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

  await Promise.all([
    pkg([`.`, `-t`, `node${nodeVersion}-${arch}`, `-o`, `${buildDir}/${arch}/${cleverTools}`]),
    fs.copy(`nodegit/${arch}-nodegit.node`, `${buildDir}/${arch}/nodegit.node`),
  ])

  if (arch === 'win') {
    await asyncExec(`zip -j ${archivePath} ${buildDir}/${arch}/${cleverTools} ${buildDir}/${arch}/nodegit.node`)
  }
  else {
    await asyncExec(`tar czf "${archivePath}" -C ${buildDir}/${arch} ${cleverTools} nodegit.node`)
  }

  await del(`${buildDir}/${arch}`)

  const sum = await checksum(`${archivePath}`)
  await fs.outputFile(`${archivePath}.sha256`, sum)
  await fs.appendFile(`${buildDir}/sha.properties`, `SHA256_${arch}=${sum}\n`)

  if (cleverToolsVersion !== 'master') {
    if (!process.env.S3_KEY_ID || !process.env.S3_SECRET_KEY) {
      throw new Error('Could not read S3 access/secret keys!')
    }
    await Promise.all([
      uploadFile(`${archivePath}`),
      uploadFile(`${archivePath}.sha256`),
    ])
  }

  console.log(`\nRelease BUILT! ${archivePath}\n`)
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
