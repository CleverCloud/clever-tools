'use strict';

const crypto = require('crypto');

const Bacon = require('baconjs');
const colors = require('colors');
const request = require('request');

const handleCommandStream = require('../command-stream-handler');
const initApi = require('../models/api.js');
const Logger = require('../logger.js');
const openBrowser = require('../open-browser.js');
const User = require('../models/user.js');
const { conf, writeOAuthConf } = require('../models/configuration.js');
const { version } = require('../../package');

// 20 random bytes as Base64URL
function randomToken () {
  return crypto.randomBytes(20).toString('base64').replace(/\//g, '-').replace(/\+/g, '_').replace(/=/g, '');
}

const POLLING_INTERVAL = 2000;
const POLLING_MAX_TRY_COUNT = 60;

function getOAuthData (url, tryCount = 0) {
  if (tryCount >= POLLING_MAX_TRY_COUNT) {
    return new Bacon.Error('Something went wrong while trying to log you in.');
  }
  if (tryCount > 1 && tryCount % 10 === 0) {
    Logger.println(`We're still waiting for the login process (in your browser) to be completed…`);
  }
  return Bacon.fromNodeCallback(request, url).flatMapLatest((response) => {
    if (response.statusCode === 200) {
      const tokens = JSON.parse(response.body);
      return tokens;
    }
    if (response.statusCode === 404) {
      return Bacon.later(POLLING_INTERVAL).flatMapLatest(() => getOAuthData(url, tryCount + 1));
    }
    return new Bacon.Error('Something went wrong while trying to log you in.');
  });
}

function login (api, params) {
  const { token, secret } = params.options;
  const isLoginWithArgs = (token != null && secret != null);
  const isInteractiveLogin = (token == null && secret == null);

  const s_result = Bacon.once()
    .flatMapLatest(() => {

      if (isLoginWithArgs) {
        return { token, secret };
      }

      if (isInteractiveLogin) {
        const cliToken = randomToken();
        const consoleUrl = new URL(conf.CONSOLE_TOKEN_URL);
        consoleUrl.searchParams.set('cli_version', version);
        consoleUrl.searchParams.set('cli_token', cliToken);
        const cliPollUrl = new URL(conf.API_HOST);
        cliPollUrl.pathname = '/v2/self/cli_tokens';
        cliPollUrl.searchParams.set('cli_token', cliToken);

        Logger.debug('Try to login to Clever Cloud…');
        Logger.println(`Opening ${colors.green(consoleUrl.toString())} in your browser to log you in…`);
        return openBrowser
          .openPage(consoleUrl.toString())
          .flatMapLatest(() => getOAuthData(cliPollUrl.toString()));
      }

      return new Bacon.Error('Both `--token` and `--secret` have to be defined');
    })
    .flatMapLatest(writeOAuthConf)
    .flatMapLatest(() => {
      if (isInteractiveLogin) {
        return initApi()
          .flatMapLatest((api) => User.getCurrent(api))
          .flatMapLatest(({ name, email }) => Logger.println(`Login successful as ${name} <${email}>`));
      }
    });

  // Force process exit, otherwhise, it will be kept alive
  // because of the spawn() call (in src/open-browser.js)
  handleCommandStream(s_result, () => process.exit(0));
}

module.exports = login;
