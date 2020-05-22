'use strict';

const path = require('path');
const { expect } = require('chai');

describe('configuration', () => {

  it('should retrieve configuration in a JSON file', async () => {

    const { conf, loadOAuthConf } = require('../src/models/configuration.js');
    conf.CONFIGURATION_FILE = path.resolve(__dirname, './configuration.json');

    const oauthData = await loadOAuthConf();
    expect(oauthData.token).to.equal('aaaa');
    expect(oauthData.secret).to.equal('bbbb');
  });

  it('should return an empty configuration if the configuration file does not exist', async () => {

    const { conf, loadOAuthConf } = require('../src/models/configuration.js');
    conf.CONFIGURATION_FILE = path.resolve(__dirname, './configuration-that-does-not-exist.json');

    const oauthData = await loadOAuthConf();
    expect(oauthData.token).to.be.an('undefined');
    expect(oauthData.secret).to.be.an('undefined');
  });
});
