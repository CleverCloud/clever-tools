'use strict';

const expect = require('chai').expect;

const Domain = require('../src/models/domain.js');

describe('domain.selectBest', () => {

  it('select a custom domain name above other options', () => {
    const domains = [
      { fqdn: 'example.com' },
      { fqdn: 'example.cleverapps.io' },
      { fqdn: 'app-c677ea0c-0729-4e66-9820-23568be77468.cleverapps.io' },
    ];
    expect(Domain.selectBest(domains)).to.deep.equal({ fqdn: 'example.com' });
  });

  it('select a custom cleverapps.io domain name if no custom domain name is available', () => {
    const domains = [
      { fqdn: 'example.cleverapps.io' },
      { fqdn: 'app_c677ea0c-0729-4e66-9820-23568be77468.cleverapps.io' },
    ];
    expect(Domain.selectBest(domains)).to.deep.equal({ fqdn: 'example.cleverapps.io' });
  });

  it('select the default cleverapps.io domain name if nothing else is available', () => {
    const domains = [
      { fqdn: 'app_c677ea0c-0729-4e66-9820-23568be77468.cleverapps.io' },
    ];
    expect(Domain.selectBest(domains)).to.deep.equal({ fqdn: 'app_c677ea0c-0729-4e66-9820-23568be77468.cleverapps.io' });
  });

  it('return undefined when no domain is available', () => {
    const domains = [];
    expect(Domain.selectBest(domains)).to.equal(undefined);
  });
});
