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
      schema: z.string().min(1).optional(),
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

    const ordered = [...instances].sort((a, b) => compareInstanceNumbers(a.instanceNumber, b.instanceNumber));

    let sshTarget;
    if (instance != null) {
      const selected = selectInstance(ordered, instance);
      if (selected == null) {
        const available = ordered.map((inst) => `  - ${inst.instanceNumber} ${inst.id} (${inst.state})`).join('\n');
        throw new Error(
          `No instance ${styleText('red', instance)} on this application, pick one of:\n${styleText('grey', available)}`,
        );
      }
      sshTarget = selected.id;
    } else if (ordered.length === 1) {
      sshTarget = ordered[0].id;
    } else if (process.stdin.isTTY) {
      const choices = ordered.map((inst) => ({
        name: `${inst.displayName} - Instance ${inst.instanceNumber} - ${inst.state} (${inst.id})`,
        value: inst.id,
      }));
      sshTarget = await selectAnswer('Select an instance:', choices);
    } else {
      throw new Error('Multiple instances are running. Cannot select in non-interactive mode.');
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
 * lowest number — preferred, not guaranteed, since an application may have none.
 *
 * @param {Array<{ id: string, instanceNumber: number, state: string }>} ordered - sorted by number
 * @param {string} wanted
 * @returns {{ id: string, instanceNumber: number, state: string } | null}
 */
function selectInstance(ordered, wanted) {
  if (wanted.toLowerCase() === 'any') {
    return readiest(ordered);
  }

  const byId = ordered.find((inst) => inst.id === wanted);
  if (byId != null) {
    return byId;
  }

  const number = toInstanceNumber(wanted);
  if (number == null) {
    return null;
  }

  return readiest(ordered.filter((inst) => inst.instanceNumber === number));
}

/**
 * The first serving instance, or the first one when none is serving.
 * @param {Array<{ state: string }>} candidates
 */
function readiest(candidates) {
  return candidates.find((inst) => inst.state === 'UP') ?? candidates[0] ?? null;
}

/** Sorts unknown positions last rather than letting NaN leave the list unsorted. */
function compareInstanceNumbers(a, b) {
  if (!Number.isFinite(a)) {
    return Number.isFinite(b) ? 1 : 0;
  }
  return Number.isFinite(b) ? a - b : -1;
}

/**
 * `Number()` rounds past the safe integer range, which would make a wanted number match a
 * neighbouring one, so only exact whole numbers count as one.
 * @param {string} wanted
 * @returns {number | null}
 */
function toInstanceNumber(wanted) {
  const asNumber = /^\d+$/.test(wanted) ? Number(wanted) : Number.NaN;
  return Number.isSafeInteger(asNumber) ? asNumber : null;
}
