'use strict';

const Bacon = require('baconjs');

const handleCommandStream = require('../command-stream-handler');
const interact = require('../models/interact.js');
const Logger = require('../logger.js');
const openBrowser = require('../open-browser.js');
const { conf, writeOAuthConf } = require('../models/configuration.js');

function getOAuthData () {
  Logger.debug('Ask for tokens…');
  const s_token = interact.ask('Enter CLI token: ');
  const s_secret = s_token.flatMapLatest(() => interact.ask('Enter CLI secret: '));

  return Bacon.combineTemplate({
    token: s_token,
    secret: s_secret,
  });
}

function login (api, params) {
  const { token, secret } = params.options;

  const s_result = Bacon.once()
    .flatMapLatest(() => {

      if (token == null && secret == null) {
        Logger.debug('Try to login to Clever Cloud…');
        Logger.println(`Opening ${conf.CONSOLE_TOKEN_URL} in your browser…`);
        return openBrowser
          .openPage(conf.CONSOLE_TOKEN_URL)
          .flatMapLatest(getOAuthData);
      }

      if (token == null || secret == null) {
        return new Bacon.Error('Both `--token` and `--secret` have to be defined');
      }

      return { token, secret };
    })
    .flatMapLatest(writeOAuthConf)
    .map(() => Logger.println(`${conf.CONFIGURATION_FILE} has been updated.`));

  // Force process exit, otherwhise, it will be kept alive
  // because of the spawn() call (in src/open-browser.js)
  handleCommandStream(s_result, () => process.exit(0));
}

module.exports = login;
