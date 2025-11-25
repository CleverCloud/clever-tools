import { colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';
import crypto from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import open from 'open';
import pkg from '../../../package.json' with { type: 'json' };
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

export const loginCommand = {
  name: 'login',
  description: 'Login to Clever Cloud',
  experimental: false,
  featureFlag: null,
  opts: {
    token: {
      name: 'token',
      description: 'Directly give an existing token',
      type: 'option',
      metavar: 'token',
      aliases: null,
      default: null,
      required: null,
      parser: null,
      complete: null
    },
    secret: {
      name: 'secret',
      description: 'Directly give an existing secret',
      type: 'option',
      metavar: 'secret',
      aliases: null,
      default: null,
      required: null,
      parser: null,
      complete: null
    },
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt
  },
  args: [],
  async execute(params) {
    const { token, secret } = params.options;
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
  }
};
