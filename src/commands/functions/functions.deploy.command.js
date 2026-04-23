import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { createDeployment, getDeployment, triggerDeployment, uploadFunctionFile } from '../../clever-client/functions.js';
import { getOwnerIdFromOrgIdOrName } from '../../models/ids-resolver.js';
import { sendToApi } from '../../models/send-to-api.js';
import { orgaIdOrNameOption } from '../global.options.js';

const POLL_INTERVAL_MS = 1500;

const PLATFORM_BY_EXT = {
  js: 'JAVA_SCRIPT',
  ts: 'ASSEMBLY_SCRIPT',
  rs: 'RUST',
  go: 'TINY_GO',
};

export const functionsDeployCommand = defineCommand({
  description: 'Deploy source code to a Clever Cloud Function',
  since: '4.9.0',
  options: {
    org: orgaIdOrNameOption,
  },
  args: [
    defineArgument({
      schema: z.string(),
      description: 'Function ID',
      placeholder: 'function-id',
    }),
    defineArgument({
      schema: z.string(),
      description: 'Path to the source file (.js, .ts, .rs, .go)',
      placeholder: 'file',
    }),
  ],
  async handler(options, functionId, filePath) {
    const { org } = options;

    if (!fs.existsSync(filePath)) {
      throw new Error(`File ${styleText('red', filePath)} does not exist`);
    }

    const ext = path.extname(filePath).replace('.', '');
    const platform = PLATFORM_BY_EXT[ext];
    if (platform == null) {
      throw new Error(
        `Unsupported file extension ${styleText('red', `.${ext}`)}. Supported: ${Object.keys(PLATFORM_BY_EXT).map((e) => `.${e}`).join(', ')}`,
      );
    }

    const ownerId = await getOwnerIdFromOrgIdOrName(org);

    Logger.println(`Deploying ${styleText('blue', filePath)} as ${platform} to function ${styleText('blue', functionId)}...`);

    let deployment = await createDeployment({ ownerId, functionId }, { platform }).then(sendToApi);

    Logger.debug(`Deployment ${deployment.id} created, uploading file...`);
    await uploadFunctionFile(deployment.uploadUrl, filePath);
    Logger.debug('File uploaded, triggering build...');

    await triggerDeployment({ ownerId, functionId, deploymentId: deployment.id }).then(sendToApi);

    Logger.println(`⏳ Building from ${platform} to WASM...`);

    while (deployment.status !== 'READY' && deployment.status !== 'ERROR') {
      Logger.debug(`Deployment status: ${deployment.status}`);
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      deployment = await getDeployment({ ownerId, functionId, deploymentId: deployment.id }).then(sendToApi);
    }

    if (deployment.status === 'ERROR') {
      throw new Error(`Deployment failed: ${deployment.errorReason ?? 'unknown error'}`);
    }

    Logger.printSuccess('Function deployed and ready!');
    if (deployment.url) {
      Logger.println(`  Call it: ${styleText('blue', `curl ${deployment.url}`)}`);
    }
  },
});
