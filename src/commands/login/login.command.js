import { get as getUser } from '@clevercloud/client/esm/api/v2/organisation.js';
import crypto from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import open from 'open';
import { z } from 'zod';
import pkg from '../../../package.json' with { type: 'json' };
import { baseConfig, saveProfile } from '../../config/config.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { formatProfile } from '../../lib/profile.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { sendToApiWithConfig } from '../../models/send-to-api.js';

function randomToken() {
  return crypto.randomBytes(20).toString('base64').replace(/\//g, '-').replace(/\+/g, '_').replace(/=/g, '');
}

const POLLING_INTERVAL = 2000;

const POLLING_MAX_TRY_COUNT = 60;

function pollOauthData(url, tryCount = 0) {
  if (tryCount >= POLLING_MAX_TRY_COUNT) {
    throw new Error('Something went wrong while trying to log you in.');
  }
  if (tryCount > 1 && tryCount % 10 === 0) {
    Logger.println("We're still waiting for the login process (in your browser) to be completed…");
  }

  return globalThis
    .fetch(url)
    .then(async (r) => {
      if (r.status === 404) {
        await delay(POLLING_INTERVAL);
        return pollOauthData(url, tryCount + 1);
      }
      return r.json();
    })
    .catch(async () => {
      throw new Error('Something went wrong while trying to log you in.');
    });
}

async function loginViaConsole(apiHost, consoleTokenUrl) {
  const cliToken = randomToken();

  const consoleUrl = new URL(consoleTokenUrl);
  consoleUrl.searchParams.set('cli_version', pkg.version);
  consoleUrl.searchParams.set('cli_token', cliToken);

  const cliPollUrl = new URL(apiHost);
  cliPollUrl.pathname = '/v2/self/cli_tokens';
  cliPollUrl.searchParams.set('cli_token', cliToken);

  Logger.debug('Try to login to Clever Cloud…');
  Logger.println(`Opening ${styleText('blue', consoleUrl.toString())} in your browser to log you in…`);
  await open(consoleUrl.toString(), { wait: false });

  return pollOauthData(cliPollUrl.toString());
}

export const loginCommand = defineCommand({
  description: 'Login to Clever Cloud',
  since: '0.2.0',
  options: {
    token: defineOption({
      name: 'token',
      schema: z.string().optional(),
      description: 'Provide an existing token',
      placeholder: 'token',
    }),
    secret: defineOption({
      name: 'secret',
      schema: z.string().optional(),
      description: 'Provide an existing secret',
      placeholder: 'secret',
    }),
    alias: defineOption({
      name: 'alias',
      aliases: ['a'],
      schema: z
        .string()
        .min(1, { message: 'Profile alias cannot be empty' })
        .regex(/^[a-zA-Z0-9_-]+$/, { message: 'Alias must only contain letters, numbers, hyphens and underscores' })
        .refine((a) => a !== '$env', { message: '"$env" is reserved auth via environment variables' })
        .default('default'),
      description: 'Profile alias for this login',
      placeholder: 'alias',
    }),
    apiHost: defineOption({
      name: 'api-host',
      schema: z.string().url().optional(),
      description: 'API host URL override for this profile',
      placeholder: 'url',
    }),
    consoleUrl: defineOption({
      name: 'console-url',
      schema: z.string().url().optional(),
      description: 'Console URL override for this profile',
      placeholder: 'url',
    }),
    authBridgeHost: defineOption({
      name: 'auth-bridge-host',
      schema: z.string().url().optional(),
      description: 'Auth bridge URL override for this profile',
      placeholder: 'url',
    }),
    sshGateway: defineOption({
      name: 'ssh-gateway',
      schema: z.string().optional(),
      description: 'SSH gateway override for this profile',
      placeholder: 'address',
    }),
    consumerKey: defineOption({
      name: 'oauth-consumer-key',
      schema: z.string().optional(),
      description: 'OAuth consumer key override for this profile',
      placeholder: 'key',
    }),
    consumerSecret: defineOption({
      name: 'oauth-consumer-secret',
      schema: z.string().optional(),
      description: 'OAuth consumer secret override for this profile',
      placeholder: 'secret',
    }),
  },
  async handler(options) {
    const { token, secret } = options;
    const hasToken = token != null;
    const hasSecret = secret != null;

    if (hasToken !== hasSecret) {
      throw new Error('Both `--token` and `--secret` have to be defined');
    }

    const apiHost = options.apiHost ?? baseConfig.API_HOST;
    const consoleUrl = options.consoleUrl ? `${options.consoleUrl}/cli-oauth` : baseConfig.CONSOLE_TOKEN_URL;
    const oauthData = hasToken ? { token, secret } : await loginViaConsole(apiHost, consoleUrl);

    const user = await getUser({}).then(
      sendToApiWithConfig({
        token: oauthData.token,
        secret: oauthData.secret,
        apiHost,
        consumerKey: options.consumerKey ?? baseConfig.OAUTH_CONSUMER_KEY,
        consumerSecret: options.consumerSecret ?? baseConfig.OAUTH_CONSUMER_SECRET,
      }),
    );

    const overrideEntries = Object.entries({
      API_HOST: options.apiHost,
      CONSOLE_URL: options.consoleUrl,
      AUTH_BRIDGE_HOST: options.authBridgeHost,
      SSH_GATEWAY: options.sshGateway,
      OAUTH_CONSUMER_KEY: options.consumerKey,
      OAUTH_CONSUMER_SECRET: options.consumerSecret,
    }).filter(([, v]) => v != null);

    const profile = {
      alias: options.alias,
      token: oauthData.token,
      secret: oauthData.secret,
      expirationDate: oauthData.expirationDate,
      userId: user.id,
      email: user.email,
      overrides: overrideEntries.length > 0 ? Object.fromEntries(overrideEntries) : undefined,
    };

    await saveProfile(profile);

    Logger.printSuccess(`Login successful as ${styleText('green', formatProfile(profile))}`);
  },
});
