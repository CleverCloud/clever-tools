import { expect } from 'chai';
import {
  DomainParseError,
  getDomainUrl,
  getHostWithWildcard,
  isTestDomain,
  isTestDomainWithSubdomain,
  parseDomain,
  sortDomains,
} from '../../../../esm/utils/domains.js';

describe('domains', () => {
  describe('parseDomain()', () => {
    it('should parse a simple http URL', () => {
      const parsedDomain = parseDomain('http://example.com');
      const expected = {
        hostname: 'example.com',
        pathname: '/',
        isWildcard: false,
      };
      expect(parsedDomain).to.deep.equal(expected);
    });

    it('should parse a simple https URL', () => {
      const parsedDomain = parseDomain('https://example.com');
      const expected = {
        hostname: 'example.com',
        pathname: '/',
        isWildcard: false,
      };
      expect(parsedDomain).to.deep.equal(expected);
    });

    it('should parse a simple domain', () => {
      const parsedDomain = parseDomain('example.com');
      const expected = {
        hostname: 'example.com',
        pathname: '/',
        isWildcard: false,
      };
      expect(parsedDomain).to.deep.equal(expected);
    });

    it('should parse a domain with subdomain', () => {
      const parsedDomain = parseDomain('sub.example.com');
      const expected = {
        hostname: 'sub.example.com',
        pathname: '/',
        isWildcard: false,
      };
      expect(parsedDomain).to.deep.equal(expected);
    });

    it('should parse a wildcard domain', () => {
      const parsedDomain = parseDomain('*.example.com');
      const expected = {
        hostname: 'example.com',
        pathname: '/',
        isWildcard: true,
      };
      expect(parsedDomain).to.deep.equal(expected);
    });

    it('should parse a domain with path', () => {
      const parsedDomain = parseDomain('example.com/path');
      const expected = {
        hostname: 'example.com',
        pathname: '/path',
        isWildcard: false,
      };
      expect(parsedDomain).to.deep.equal(expected);
    });

    it('should throw DomainParseError for invalid wildcard', () => {
      const parseDomainCallback = () => parseDomain('example*.com');
      expect(parseDomainCallback).to.throw(DomainParseError).with.property('code', 'invalid-wildcard');
    });

    it('should throw DomainParseError for empty domain', () => {
      const parseDomainCallback = () => parseDomain('');
      expect(parseDomainCallback).to.throw(DomainParseError).with.property('code', 'empty');
    });

    it('should throw DomainParseError for invalid format', () => {
      const parseDomainCallback = () => parseDomain('].com');
      expect(parseDomainCallback).to.throw(DomainParseError).with.property('code', 'invalid-format');
    });
  });

  describe('getHostWithWildcard()', () => {
    it('should return hostname with wildcard prefix when isWildcard is true', () => {
      const wildcardHostname = getHostWithWildcard('example.com', true);
      expect(wildcardHostname).to.equal('*.example.com');
    });

    it('should return hostname without changes when isWildcard is false', () => {
      const nonWildcardHostname = getHostWithWildcard('example.com', false);
      expect(nonWildcardHostname).to.equal('example.com');
    });
  });

  describe('getDomainUrl()', () => {
    it('should return HTTPS URL for non-wildcard, non-HTTP only domain', () => {
      const httpsUrl = getDomainUrl('example.com', '/path', false, false);
      expect(httpsUrl).to.equal('https://example.com/path');
    });

    it('should return HTTP URL for HTTP only domain', () => {
      const httpUrl = getDomainUrl('example.com', '/path', false, true);
      expect(httpUrl).to.equal('http://example.com/path');
    });

    it('should include www for wildcard domains', () => {
      const wildcardUrl = getDomainUrl('example.com', '/path', true, false);
      expect(wildcardUrl).to.equal('https://www.example.com/path');
    });
  });

  describe('isTestDomain()', () => {
    it('should return true for cleverapps.io domain', () => {
      const isTestDomainResult = isTestDomain('app.cleverapps.io');
      expect(isTestDomainResult).to.be.equal(true);
    });

    it('should return false for non-cleverapps.io domain', () => {
      const isTestDomainResult = isTestDomain('example.com');
      expect(isTestDomainResult).to.be.equal(false);
    });
  });

  describe('isTestDomainWithSubdomain()', () => {
    it('should return true for cleverapps.io domain with subdomain', () => {
      const isTestWithSubdomain = isTestDomainWithSubdomain('sub.app.cleverapps.io');
      expect(isTestWithSubdomain).to.be.equal(true);
    });

    it('should return false for cleverapps.io domain without subdomain', () => {
      const isTestWithSubdomain = isTestDomainWithSubdomain('app.cleverapps.io');
      expect(isTestWithSubdomain).to.be.equal(false);
    });

    it('should return false for non-cleverapps.io domain', () => {
      const isTestWithSubdomain = isTestDomainWithSubdomain('sub.example.com');
      expect(isTestWithSubdomain).to.be.equal(false);
    });
  });

  describe('sortDomains()', () => {
    const domains = [
      { hostname: 'example.com', isPrimary: false, isWildcard: false, pathPrefix: '/' },
      { hostname: 'primary.com', isPrimary: true, isWildcard: false, pathPrefix: '/' },
      { hostname: 'sub.example.com', isPrimary: false, isWildcard: false, pathPrefix: '/' },
      { hostname: 'wildcard.com', isPrimary: false, isWildcard: true, pathPrefix: '/' },
    ];

    it('should sort domains alphabetically with primary first', () => {
      const sorted = [...domains].sort(sortDomains);
      expect(sorted).to.deep.equal([
        { hostname: 'primary.com', isPrimary: true, isWildcard: false, pathPrefix: '/' },
        { hostname: 'sub.example.com', isPrimary: false, isWildcard: false, pathPrefix: '/' },
        { hostname: 'example.com', isPrimary: false, isWildcard: false, pathPrefix: '/' },
        { hostname: 'wildcard.com', isPrimary: false, isWildcard: true, pathPrefix: '/' },
      ]);
    });
  });
});
