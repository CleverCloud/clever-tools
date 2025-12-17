import crypto from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import open from 'open';
import { z } from 'zod';
import pkg from '../../../package.json' with { type: 'json' };
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { conf, writeOAuthConf } from '../../models/configuration.js';
import * as User from '../../models/user.js';

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

async function loginViaConsole() {
  const cliToken = randomToken();

  const consoleUrl = new URL(conf.CONSOLE_TOKEN_URL);
  consoleUrl.searchParams.set('cli_version', pkg.version);
  consoleUrl.searchParams.set('cli_token', cliToken);

  const cliPollUrl = new URL(conf.API_HOST);
  cliPollUrl.pathname = '/v2/self/cli_tokens';
  cliPollUrl.searchParams.set('cli_token', cliToken);

  Logger.debug('Try to login to Clever Cloud…');
  Logger.println(`Opening ${styleText('green', consoleUrl.toString())} in your browser to log you in…`);
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
      description: 'Directly give an existing token',
      placeholder: 'token',
    }),
    secret: defineOption({
      name: 'secret',
      schema: z.string().optional(),
      description: 'Directly give an existing secret',
      placeholder: 'secret',
    }),
  },
  args: [],
  async handler(options) {
    const { token, secret } = options;
    const isLoginWithArgs = token != null && secret != null;
    const isInteractiveLogin = token == null && secret == null;

    if (isLoginWithArgs) {
      return writeOAuthConf({ token, secret });
    }

    if (isInteractiveLogin) {
      const oauthData = await loginViaConsole();
      await writeOAuthConf(oauthData);
      const { name, email } = await User.getCurrent();
      const formattedName = name || styleText(['red', 'bold'], '[unspecified name]');
      return Logger.println(`Login successful as ${formattedName} <${email}>`);
    }

    throw new Error('Both `--token` and `--secret` have to be defined');
  },
});
