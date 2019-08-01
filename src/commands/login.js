'use strict';

const crypto = require('crypto');
const util = require('util');

const delay = util.promisify(setTimeout);

const colors = require('colors/safe');
const opn = require('opn');
const superagent = require('superagent');

const Logger = require('../logger.js');
const User = require('../models/user.js');
const { conf, writeOAuthConf } = require('../models/configuration.js');
const { version } = require('../../package');

// 20 random bytes as Base64URL
function randomToken () {
  return crypto.randomBytes(20).toString('base64').replace(/\//g, '-').replace(/\+/g, '_').replace(/=/g, '');
}

const POLLING_INTERVAL = 2000;
const POLLING_MAX_TRY_COUNT = 60;

function pollOauthData (url, tryCount = 0) {

  if (tryCount >= POLLING_MAX_TRY_COUNT) {
    throw new Error('Something went wrong while trying to log you in.');
  }
  if (tryCount > 1 && tryCount % 10 === 0) {
    Logger.println(`We're still waiting for the login process (in your browser) to be completed…`);
  }

  return superagent
    .get(url)
    .send()
    .then(({ body }) => body)
    .catch(async (e) => {
      if (e.status === 404) {
        await delay(POLLING_INTERVAL);
        return pollOauthData(url, tryCount + 1);
      }
      throw new Error('Something went wrong while trying to log you in.');
    });
}

async function loginViaConsole () {

  const cliToken = randomToken();

  const consoleUrl = new URL(conf.CONSOLE_TOKEN_URL);
  consoleUrl.searchParams.set('cli_version', version);
  consoleUrl.searchParams.set('cli_token', cliToken);

  const cliPollUrl = new URL(conf.API_HOST);
  cliPollUrl.pathname = '/v2/self/cli_tokens';
  cliPollUrl.searchParams.set('cli_token', cliToken);

  Logger.debug('Try to login to Clever Cloud…');
  Logger.println(`Opening ${colors.green(consoleUrl.toString())} in your browser to log you in…`);
  await opn(consoleUrl.toString(), { wait: false });

  return pollOauthData(cliPollUrl.toString());
}

async function login (params) {
  const { token, secret } = params.options;
  const isLoginWithArgs = (token != null && secret != null);
  const isInteractiveLogin = (token == null && secret == null);

  if (isLoginWithArgs) {
    return writeOAuthConf({ token, secret }).toPromise();
  }

  if (isInteractiveLogin) {
    const oauthData = await loginViaConsole();
    await writeOAuthConf(oauthData).toPromise();
    const { name, email } = await User.getCurrent();
    const formattedName = name || colors.red.bold('[unspecified name]');
    return Logger.println(`Login successful as ${formattedName} <${email}>`);
  }

  throw new Error('Both `--token` and `--secret` have to be defined');
}

module.exports = { login };
