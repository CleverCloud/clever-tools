'use strict';

const User = require('../models/user.js');
const FaaSConfig = require('../models/faas_configuration.js');
const path = require('path');
const os = require('os');
const fs = require('fs');
const childProcess = require('child_process');
const timers = require('timers/promises');
const Logger = require('../logger.js');

const { rollup } = require('rollup');
const nodeResolve = require('@rollup/plugin-node-resolve');
const { sendToApi } = require('../models/send-to-api.js');

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

async function list () {
  const { id: OWNER_ID } = await User.getCurrent();
  const functionsList = await getFunctionsList({
    ownerId: OWNER_ID,
  }).then(sendToApi);

  console.table(functionsList, ['id', 'createdAt', 'updatedAt']);
}

async function deploy (params) {

  const config = await FaaSConfig.loadFunctionConf();
  const { id: OWNER_ID } = await User.getCurrent();
  const { id : functionFromConfig } = FaaSConfig.findFunction(config);
  const [inputFilename, functionFromArgs] = params.args;
  const FUNCTION_ID = functionFromArgs || functionFromConfig;

  const inputFilepath = path.resolve(process.cwd(), inputFilename);
  const inputExtension = path.extname(inputFilename);

  Logger.info(`Deploying ${inputFilepath}`);
  Logger.info(`Deploying to function ${FUNCTION_ID} of user ${OWNER_ID}`);

  let outputWasm, outputFilepath, outputWasmFilepath = null;

  switch (inputExtension) {
    case '.js': {
      checkCommand('qjsc', ['-h']);
      const outputFilename = getRandomFilename(inputFilename, inputExtension);
      outputWasmFilepath = getTempWasmFilename(outputFilename);

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

      outputWasm = fs.readFileSync(outputWasmFilepath);

      break;
    }
    case '.go': {
      checkCommand('go', ['version']);
      const outputFilename = getRandomFilename(inputFilename, inputExtension);
      outputWasmFilepath = getTempWasmFilename(outputFilename);

      console.log('Compiling WASM...');
      childProcess.spawnSync('go', ['build', '-o', outputWasmFilepath, inputFilepath],{
        env: {
            ...process.env,
            GOOS: 'wasip1',
            GOARCH: 'wasm'
        }});
      console.log('  DONE!');

      outputWasm = fs.readFileSync(outputWasmFilepath);

      break;
    }
    case '.wasm': {
      outputWasmFilepath = inputFilepath;
      outputWasm = fs.readFileSync(outputWasmFilepath);
      break;
    }
    default: {
      console.error('Only .js and wasm files are supported');
    }
  }

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

  Logger.info('Cleaning up...');
  Logger.info(outputFilepath);
  Logger.info(outputWasmFilepath);
  fs.existsSync(outputFilepath) && fs.rmSync(outputFilepath);
  inputExtension != '.wasm' && fs.existsSync(outputWasmFilepath) && fs.rmSync(outputWasmFilepath);
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

function getFunctionsList (params) {
  return Promise.resolve({
    method: 'get',
    url: `/v4/functions/organizations/${params.ownerId}/functions`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
}

function checkCommand (command, args) {
  const childProcess = require('child_process');
  const checkGoCommand = childProcess.spawnSync(command, args, { stdio: 'ignore' });

  if (checkGoCommand.error) {
      throw new Error(`Command '${command}' not found, it's required to deploy your project as a Clever Function`);
  }
}

function getRandomFilename (filename, extension) {
  const randomString = Math.random().toString(36).slice(2);
  return 'clever-cloud-faas-' + filename.replace(/(\.[^.]+)$/, `-${randomString}${extension}`);
}

function getTempWasmFilename (filename) {
  outputFilepath = path.resolve(os.tmpdir(), filename);
  return outputFilepath.replace(/(\.[^.]+)$/, '.wasm');
}

module.exports = {
  list,
  deploy,
};
