import { getAllInstances } from '@clevercloud/client/esm/api/v2/application.js';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { config } from '../../config/config.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { selectAnswer } from '../../lib/prompts.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';

export const sshCommand = defineCommand({
  description: 'Connect to running instances through SSH',
  since: '0.7.0',
  options: {
    identityFile: defineOption({
      name: 'identity-file',
      schema: z.string().optional(),
      description: 'SSH identity file',
      aliases: ['i'],
      placeholder: 'identity-file',
    }),
    command: defineOption({
      name: 'command',
      schema: z.string().optional(),
      description: 'Execute a command on the remote instance and exit',
      aliases: ['c'],
      placeholder: 'command',
    }),
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [],
  async handler(options) {
    const { alias, app: appIdOrName, identityFile, command } = options;
    const { appId, ownerId } = await Application.resolveId(appIdOrName, alias);

    const instances = await getAllInstances({ id: ownerId, appId }).then(sendToApi);

    if (instances.length === 0) {
      throw new Error('No running instances found for this application');
    }

    let sshTarget;
    if (instances.length === 1) {
      sshTarget = instances[0].id;
    } else if (process.stdout.isTTY) {
      const choices = instances
        .sort((a, b) => a.instanceNumber - b.instanceNumber)
        .map((inst) => ({
          name: `${inst.displayName} - Instance ${inst.instanceNumber} - ${inst.state} (${inst.id})`,
          value: inst.id,
        }));
      sshTarget = await selectAnswer('Select an instance:', choices);
    } else {
      throw new Error('Multiple instances are running. Cannot select in non-interactive mode.');
    }

    const sshParams = [];
    // -t: force PTY allocation (SSH skips it by default because appId is passed as a command for gateway routing)
    if (command == null) {
      sshParams.push('-t');
    }
    if (identityFile != null) {
      sshParams.push('-i', identityFile);
    }
    sshParams.push(config.SSH_GATEWAY, sshTarget);

    // Interactive session mode (spawn SSH with inherited stdio)
    if (command == null) {
      return new Promise((resolve, reject) => {
        const sshProcess = spawn('ssh', sshParams, { stdio: 'inherit' });
        sshProcess.on('exit', resolve);
        sshProcess.on('error', reject);
      });
    }

    // Single command mode (pipe stdio to filter gateway noise via a marker)
    const sshProcess = spawn('ssh', sshParams, { stdio: 'pipe' });

    // We can't pass the command directly via `ssh gateway 'cmd'` because appId already occupies
    // the remote command slot (used by the gateway for routing). So we write into stdin and use
    // a marker to delimit the start of real output from gateway/login noise.
    const marker = `__CLEVER_${randomUUID()}__`;
    sshProcess.stdin.write(`echo '${marker}'\n`);

    // `exec $SHELL --login -c` ensures the full login environment is loaded (.bashrc, env vars)
    // while keeping stdout clean (no PTY = no prompt/ANSI noise).
    const escapedCommand = command.replaceAll("'", "'\\''");
    sshProcess.stdin.write(`exec $SHELL --login -c '${escapedCommand}'\n`);
    sshProcess.stdin.end();

    // Skip gateway/login noise on both stdout and stderr, stream after the marker.
    // If ssh never reaches the marker (auth failure, connection refused, bad key
    // permissions, …) we flush the buffered pre-marker bytes on non-zero exit so
    // the user actually sees the error instead of getting silent exit-255.
    let started = false;
    let stdoutBuf = '';
    let stderrBuf = '';
    sshProcess.stdout.on('data', (chunk) => {
      if (started) {
        process.stdout.write(chunk);
        return;
      }
      stdoutBuf += chunk.toString();
      const idx = stdoutBuf.indexOf(marker + '\n');
      if (idx !== -1) {
        started = true;
        const rest = stdoutBuf.slice(idx + marker.length + 1);
        if (rest) process.stdout.write(rest);
        stdoutBuf = '';
      }
    });

    sshProcess.stderr.on('data', (chunk) => {
      if (started) {
        process.stderr.write(chunk);
      } else {
        stderrBuf += chunk.toString();
      }
    });

    const exitCode = await new Promise((resolve) => sshProcess.on('exit', resolve));
    if (exitCode !== 0 && !started) {
      if (stdoutBuf) {
        process.stdout.write(stdoutBuf);
      }
      if (stderrBuf) {
        process.stderr.write(stderrBuf);
      }
    }
    process.exit(exitCode);
  },
});
