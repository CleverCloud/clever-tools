'use strict';

const path = require('path');
const os = require('os');
const fs = require('fs');
const childProcess = require('child_process');
const timers = require('timers/promises');

const { rollup } = require('rollup');
const nodeResolve = require('@rollup/plugin-node-resolve');
const { sendToApi } = require('../models/send-to-api.js');

const OWNER_ID = 'user_cd104d3c-d81f-49eb-a216-6fc4526e0412';
const FUNCTION_ID = 'function_f708fc89-3ba0-4eb5-9cdf-c624480d8df5';

const WASMEDGE_MODULES = [
  'buffer',
  'encoding',
  'events',
  'fmt/printf',
  'http',
  'internal/errors',
  'internal/normalize_encoding',
  'internal/streams/add-abort-signal',
  'internal/streams/buffer_list',
  'internal/streams/compose',
  'internal/streams/destroy',
  'internal/streams/duplex',
  'internal/streams/end-of-stream',
  'internal/streams/from',
  'internal/streams/legacy',
  'internal/streams/passthrough',
  'internal/streams/pipeline',
  'internal/streams/readable',
  'internal/streams/state',
  'internal/streams/transform',
  'internal/streams/utils',
  'internal/streams/writable',
  'internal/util',
  'internal/util/debuglog',
  'internal/util/types',
  'internal/validators',
  'os',
  'path',
  'process',
  'punycode',
  'querystring',
  'stream',
  'stream/consumers',
  'stream/promises',
  'string_decoder',
  'timers',
  'timers/promises',
  'url',
  'util',
  'util/types',
  'whatwg_url',
];

async function list (params) {
  console.log('list faas');
}

async function deploy (params) {

  const [inputFilename] = params.args;

  const inputFilepath = path.resolve(process.cwd(), inputFilename);

  const randomString = Math.random().toString(36).slice(2);
  const outputFilename = 'clever-cloud-faas-' + inputFilename.replace(/\.js$/, `-${randomString}.js`);
  const outputFilepath = path.resolve(os.tmpdir(), outputFilename);
  const outputWasmFilepath = outputFilepath.replace(/\.js/, '.wasm');

  console.log('Bundling...');
  const outputCode = await bundleAndWrap({
    inputFilename,
    inputFilepath,
    outputFilename,
  });
  console.log('  DONE!');

  console.log('Compiling WASM...');
  await compileWasm({ outputFilepath, outputWasmFilepath, outputCode });
  console.log('  DONE!');

  const outputWasm = fs.readFileSync(outputWasmFilepath);

  console.log('Deploying WASM code to Clever Cloud...');

  let deployment = await createFunctionDeployment({
    ownerId: OWNER_ID,
    functionId: FUNCTION_ID,
  }, {
    name: 'the name',
    description: 'the desc',
    tag: 'the tag',
    platform: 'JAVA_SCRIPT',
  }).then(sendToApi);

  await uploadFunctionWasm(deployment.uploadUrl, outputWasm);

  await triggerFunctionDeployment({
    ownerId: OWNER_ID,
    functionId: FUNCTION_ID,
    deploymentId: deployment.id,
  }).then(sendToApi);

  console.log('  DONE!');

  console.log('Waiting for deployment to end...');
  await timers.setTimeout(2_000);
  while (deployment.status !== 'READY') {
    console.log('  still waiting...');
    deployment = await getDeploymentStatus({
      ownerId: OWNER_ID,
      functionId: FUNCTION_ID,
      deploymentId: deployment.id,
    }).then(sendToApi);

    await timers.setTimeout(2_000);
  }
  console.log('  DONE!');

  console.log('');
  console.log('Ready on ' + deployment.url + '?trigger=http');

  // fs.rmSync(outputFilepath);
  // fs.rmSync(outputWasmFilepath);
}

async function bundleAndWrap ({ inputFilepath, outputFilename }) {

  const mainFilepath = path.resolve(__dirname, '..', 'faas-files', 'main.js');

  const inputOptions = {
    input: mainFilepath,
    external: [
      'wasi_http',
      '_encoding',
    ],
    plugins: [
      nodeResolve(),
      {
        resolveId (source, importer, options) {
          if (source === 'cc:main-handler') {
            return inputFilepath;
          }
          if (WASMEDGE_MODULES.includes(source)) {
            return path.resolve(__dirname, '..', 'faas-files', 'modules', `${source}.js`);
          }
        },
      },
    ],
  };

  const outputOptions = {
    file: outputFilename,
    format: 'esm',
  };

  const bundle = await rollup(inputOptions);
  const { output } = await bundle.generate(outputOptions);
  const outputCode = output[0].code;

  await bundle.close();

  return outputCode;
}

async function compileWasm ({ outputFilepath, outputWasmFilepath, outputCode }) {
  fs.writeFileSync(outputFilepath, outputCode);
  const qjscOutput = childProcess.spawnSync('qjsc', ['-w', outputFilepath, '-o', outputWasmFilepath]);
  // console.log(qjscOutput.output.toString());
}

// async function deployFunction ({ ownerId, functionId, outputWasmFilepath }) {
//
//   const cleverctlProcess = childProcess.spawnSync('cleverctl', [
//     'functions',
//     'deploy',
//     'create',
//     '--file',
//     outputWasmFilepath,
//     '--platform',
//     'js',
//     ownerId,
//     functionId,
//   ]);
//
//   const cleverctlOutputJson = cleverctlProcess.output
//     .filter((a) => a != null)
//     .map((buffer) => buffer.toString())
//     .join('')
//     .trim()
//     .split('\n')
//     // Remove first line with URL
//     .slice(1)
//     .join('\n');
//
//   return JSON.parse(cleverctlOutputJson);
// }

function createFunctionDeployment (params, body) {
  return Promise.resolve({
    method: 'post',
    url: `/v4/functions/organizations/${params.ownerId}/functions/${params.functionId}/deployments`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body,
  });
}

function uploadFunctionWasm (uploadUrl, wasmContent) {
  return fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/wasm',
    },
    body: wasmContent,
  });
}

function triggerFunctionDeployment (params) {
  return Promise.resolve({
    method: 'post',
    url: `/v4/functions/organizations/${params.ownerId}/functions/${params.functionId}/deployments/${params.deploymentId}/trigger`,
  });
}

function getDeploymentStatus (params) {
  return Promise.resolve({
    method: 'get',
    url: `/v4/functions/organizations/${params.ownerId}/functions/${params.functionId}/deployments/${params.deploymentId}`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
}

module.exports = {
  list,
  deploy,
};
