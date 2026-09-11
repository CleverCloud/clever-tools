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
    instance: defineOption({
      name: 'instance',
      schema: z.string().min(1).optional(),