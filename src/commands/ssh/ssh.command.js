import { getAllInstances } from '@clevercloud/client/esm/api/v2/application.js';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { config } from '../../config/config.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { selectAnswer } from '../../lib/prompts.js';
import { styleText } from '../../lib/style-text.js';
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
    instance: defineOption({
      name: 'instance',
      // Most specific first: z.union keeps the first match and an ID accepts any string
      schema: z
        .union([z.literal('any'), z.string().regex(/^\d+$/).transform(Number).pipe(z.int()), z.string().min(1)])
        .optional(),
      description: 'Instance to connect to, by ID or number, or `any` (skips interactive selection)',
      placeholder: 'instance-id|number|any',
    }),
    alias: aliasOption,
    app: appIdOrNameOption,
  },
  args: [],
  async handler(options) {
    const { alias, app: appIdOrName, identityFile, command, instance } = options;
    const { appId, ownerId } = await Application.resolveId(appIdOrName, alias);

    const instances = await getAllInstances({ id: ownerId, appId }).then(sendToApi);

    if (instances.length === 0) {
      throw new Error('No running instances found for this application');
    }

    // Instances without a number go last, can happen at the very beginning of booting
    const sortedInstances = instances.toSorted((a, b) => {
      return (a.instanceNumber ?? Infinity) - (b.instanceNumber ?? Infinity);
    });

    if (instance == null && sortedInstances.length > 1 && !process.stdin.isTTY) {
      throw new Error(`Multiple instances are running, pick one with --instance:\n${formatInstances(sortedInstances)}`);
    }

    let sshTarget;
    if (instance != null) {
      const selectedInstance = selectInstance(sortedInstances, instance);
      if (selectedInstance == null) {
        throw new Error(
          `No instance ${styleText('red', String(instance))} on this application, pick one with --instance:\n${formatInstances(sortedInstances)}`,
        );
      }
      sshTarget = selectedInstance.id;
    } else if (sortedInstances.length === 1) {
      sshTarget = sortedInstances[0].id;
    } else {
      const choices = sortedInstances.map((i) => ({
        name: `${i.displayName} - Instance ${i.instanceNumber} - ${i.state} (${i.id})`,
        value: i.id,
      }));
      sshTarget = await selectAnswer('Select an instance:', choices);
    }

    const sshParams = [];
    // Clever Cloud SSH only accepts key auth. Disable password fallback so a missing
    // or unregistered key fails fast instead of prompting for a password that cannot work.
    sshParams.push('-o', 'PreferredAuthentications=publickey', '-o', 'PasswordAuthentication=no');
    // -t: force PTY allocation (SSH skips it by default because appId is passed as a command for gateway routing)
    if (command == null) {
      sshParams.push('-t');
    }
    if (identityFile != null) {
      // -i adds the key to the ones ssh may offer, but doesn't guarantee it's the one used
      sshParams.push('-i', identityFile);
      // IdentitiesOnly forces ssh to only offer this key, ignoring agent/default ones
      sshParams.push('-o', 'IdentitiesOnly=yes');
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

    // Skip gateway/login noise on both stdout and stderr, stream after the marker
    let started = false;
    let buf = '';
    sshProcess.stdout.on('data', (chunk) => {
      if (started) {
        process.stdout.write(chunk);
        return;
      }
      buf += chunk.toString();
      const idx = buf.indexOf(marker + '\n');
      if (idx !== -1) {
        started = true;
        const rest = buf.slice(idx + marker.length + 1);
        if (rest) process.stdout.write(rest);
        buf = '';
      }
    });

    // Discard stderr noise before the marker, forward after
    sshProcess.stderr.on('data', (chunk) => {
      if (started) {
        process.stderr.write(chunk);
      }
    });

    const exitCode = await new Promise((resolve) => sshProcess.on('exit', resolve));
    process.exit(exitCode);
  },
});

/**
 * Pick the instance the caller asked for, by ID, by number, or `any`, or nothing when none match.
 *
 * Numbers are not unique: while a deployment rolls, the instance going away and the one coming up
 * carry the same number. `UP` ones are preferred among them, and `any` prefers an `UP` one over the
 * lowest number.
 *
 * @param {Array<{ id: string, instanceNumber?: number, state: string }>} sortedInstances - sorted by instance number
 * @param {string | number | 'any'} wanted - an instance ID, an instance number or `any`
 * @returns {{ id: string, instanceNumber?: number, state: string } | null}
 */
function selectInstance(sortedInstances, wanted) {
  if (wanted === 'any') {
    return getReadiestInstance(sortedInstances);
  }
  if (typeof wanted === 'number') {
    return getReadiestInstance(sortedInstances.filter((i) => i.instanceNumber === wanted));
  }
  return sortedInstances.find((i) => i.id === wanted) ?? null;
}

/**
 * The first serving instance, or the first one when none is serving.
 * @param {Array<{ id: string, instanceNumber?: number, state: string }>} sortedInstances - sorted by instance number
 * @returns {{ id: string, instanceNumber?: number, state: string } | null}
 */
function getReadiestInstance(sortedInstances) {
  return sortedInstances.find((i) => i.state === 'UP') ?? sortedInstances[0] ?? null;
}

/**
 * One line per instance, to help the caller pick one with `--instance`.
 * @param {Array<{ id: string, instanceNumber?: number, state: string }>} instances
 * @returns {string}
 */
function formatInstances(instances) {
  const lines = instances.map((i) => `  - ${i.instanceNumber} ${i.id} (${i.state})`);
  return styleText('grey', lines.join('\n'));
}
