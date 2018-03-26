'use strict';

const expect = require('chai').expect;

const drain = require('../src/models/drain.js');

describe('drain', function () {

  it('authorizes ElasticSearch with credentials', () => {
    const isAuthorized = drain.authorizeDrainCreation('ElasticSearch', {username: 'john', password: 'changeme'});
    expect(isAuthorized).to.be.true;
  });

  it('does not authorize ElasticSearch without credentials', () => {
    const isAuthorized = drain.authorizeDrainCreation('ElasticSearch', {username: null, password: null});
    expect(isAuthorized).to.be.false;
  });

});
