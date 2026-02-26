import { spawn } from 'node:child_process';
import { z } from 'zod';
import { config } from '../../config/config.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { aliasOption, appIdOrNameOption } from '../global.options.js';

/**
 * Execute a command on a remote instance via the SSH gateway.
 * Since the gateway requires a TTY and doesn't support passing commands
 * after the app ID, we pipe the command via stdin using unique markers
 * to extract the clean output.
 * @param {string[]} sshParams - SSH parameters (e.g. ['-tt', gateway, appId])
 * @param {string} command - The command to execute remotely
 * @returns {Promise<{output: string, exitCode: number}>}
 */
async function execRemoteCommand(sshParams, command) {
  const marker = `__CLEVER_SSH_${Date.now()}_${Math.random().toString(36).slice(2)}__`;
  const startMarker = `START_${marker}`;
  const endMarker = `END_${marker}`;

  const remoteScript = `echo '${startMarker}'; ${command}; echo '${endMarker}'; exit\n`;

  const sshProcess = spawn('ssh', sshParams, {
    stdin: 'pipe',
    stdout: 'pipe',
    stderr: 'pipe',
  });

  sshProcess.stdin.write(remoteScript);
  sshProcess.stdin.end();

  const chunks = [];
  for await (const chunk of sshProcess.stdout) {
    chunks.push(chunk);
  }
  const rawOutput = Buffer.concat(chunks).toString();

  const exitCode = await new Promise((resolve) => {
    sshProcess.on('exit', resolve);
  });

  // Strip ANSI escape sequences and terminal control codes
  const cleaned = rawOutput
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '') // CSI sequences
    .replace(/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g, '') // OSC sequences
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Find markers on their own lines (not inside the echoed command)
  const lines = cleaned.split('\n');
  let startLine = -1;
  let endLine = -1;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === startMarker && startLine === -1) {
      startLine = i;
    } else if (trimmed === endMarker && startLine !== -1) {
      endLine = i;
      break;
    }
  }

  if (startLine === -1 || endLine === -1) {
    throw new Error('Failed to parse remote command output');
  }

  const output = lines.slice(startLine + 1, endLine).join('\n');
  return { output, exitCode };
}

export const sshCommand = defineCommand({
  description: 'Connect to running instances through SSH',
  since: '0.7.0',
  options: {
    command: defineOption({
      name: 'command',
      schema: z.string().optional(),
      description: 'Execute a command on the instance and exit',
      aliases: ['c'],
      placeholder: 'command',
    }),
    identityFile: defineOption({
      name: 'identity-file',
      schema: z.string().optional(),
      description: 'SSH identity file',
      aliases: ['i'],
      placeholder: 'identity-file',
    }),
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [],
  async handler(options) {
    const { alias, app: appIdOrName, identityFile, command } = options;

    const { appId } = await Application.resolveId(appIdOrName, alias);

    if (command != null) {
      // Non-interactive mode: execute command and print output
      const sshParams = [
        '-tt',
        '-o',
        'StrictHostKeyChecking=accept-new',
        '-o',
        'LogLevel=ERROR',
        config.SSH_GATEWAY,
        appId,
      ];
      if (identityFile != null) {
        sshParams.push('-i', identityFile);
      }

      const { output, exitCode } = await execRemoteCommand(sshParams, command);
      Logger.println(output);
      process.exit(exitCode);
    } else {
      // Interactive mode: open a shell
      const sshParams = ['-t', config.SSH_GATEWAY, appId];
      if (identityFile != null) {
        sshParams.push('-i', identityFile);
      }

      await new Promise((resolve, reject) => {
        const sshProcess = spawn('ssh', sshParams, { stdio: 'inherit' });
        sshProcess.on('exit', resolve);
        sshProcess.on('error', reject);
      });
    }
  },
});
