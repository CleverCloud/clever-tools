'use strict';

const path = require('path');
const Bacon = require('baconjs');
const { expect } = require('chai');

describe('configuration', () => {

  it('should retrieve configuration in a JSON file', (done) => {

    const { conf, loadOAuthConf } = require('../src/models/configuration.js');
    conf.CONFIGURATION_FILE = path.resolve(__dirname, './configuration.json');

    const s_oauthData = Bacon.fromPromise(loadOAuthConf());

    s_oauthData.subscribe((event) => {
      expect(event.hasValue()).to.equal(true);
      expect(event.value().token).to.equal('aaaa');
      expect(event.value().secret).to.equal('bbbb');
      done();

      return Bacon.noMore;
    });
  });

  it('should return an empty configuration if the configuration file does not exist', (done) => {

    const { conf, loadOAuthConf } = require('../src/models/configuration.js');
    conf.CONFIGURATION_FILE = path.resolve(__dirname, './configuration-that-does-not-exist.json');

    const s_oauth_data = Bacon.fromPromise(loadOAuthConf());

    s_oauth_data.subscribe(function (event) {
      expect(event.hasValue()).to.equal(true);
      expect(event.value().token).to.be.an('undefined');
      expect(event.value().secret).to.be.an('undefined');
      done();

      return Bacon.noMore;
    });
  });
});
