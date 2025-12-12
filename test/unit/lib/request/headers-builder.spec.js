import { expect } from 'chai';
import { HeadersBuilder } from '../../../../src/lib/request/headers-builder.js';

describe('HeadersBuilder', () => {
  describe('constructor', () => {
    it('should initialize with no headers when no arguments provided', () => {
      const builder = new HeadersBuilder();
      const headers = builder.build();
      const entries = getHeadersEntries(headers);
      expect(entries).to.have.lengthOf(0);
    });

    it('should initialize with provided Headers object', () => {
      const initialHeaders = new Headers({ 'x-test': 'value' });
      const builder = new HeadersBuilder(initialHeaders);
      const headers = builder.build();
      expect(headers.get('x-test')).to.equal('value');
    });

    it('should initialize with provided plain object', () => {
      const initialHeaders = { 'x-test': 'value' };
      const builder = new HeadersBuilder(initialHeaders);
      const headers = builder.build();
      const entries = getHeadersEntries(headers);
      expect(entries).to.deep.equal([['x-test', 'value']]);
      expect(headers.get('x-test')).to.equal('value');
    });
  });

  describe('accept methods', () => {
    it('should set Accept header to JSON', () => {
      const headers = new HeadersBuilder().acceptJson().build();
      const entries = getHeadersEntries(headers);
      expect(entries).to.deep.equal([['accept', 'application/json']]);
      expect(headers.get('accept')).to.equal('application/json');
    });

    it('should set Accept header to text/plain', () => {
      const headers = new HeadersBuilder().acceptTextPlain().build();
      const entries = getHeadersEntries(headers);
      expect(entries).to.deep.equal([['accept', 'text/plain']]);
      expect(headers.get('accept')).to.equal('text/plain');
    });

    it('should set custom Accept header', () => {
      const headers = new HeadersBuilder().accept('application/xml').build();
      const entries = getHeadersEntries(headers);
      expect(entries).to.deep.equal([['accept', 'application/xml']]);
      expect(headers.get('accept')).to.equal('application/xml');
    });
  });

  describe('contentType methods', () => {
    it('should set Content-Type header to JSON', () => {
      const headers = new HeadersBuilder().contentTypeJson().build();
      expect(headers.get('content-type')).to.equal('application/json');
    });

    it('should set Content-Type header to text/plain', () => {
      const headers = new HeadersBuilder().contentTypeTextPlain().build();
      expect(headers.get('content-type')).to.equal('text/plain');
    });

    it('should set custom Content-Type header', () => {
      const headers = new HeadersBuilder().contentType('text/xml').build();
      expect(headers.get('content-type')).to.equal('text/xml');
    });
  });

  describe('authorization', () => {
    it('should set Authorization header', () => {
      const token = 'Bearer abc123';
      const headers = new HeadersBuilder().authorization(token).build();
      expect(headers.get('authorization')).to.equal(token);
    });
  });

  describe('withHeader', () => {
    it('should set custom header', () => {
      const headers = new HeadersBuilder().withHeader('x-custom', 'value').build();
      expect(headers.get('x-custom')).to.equal('value');
    });

    it('should override existing header', () => {
      const headers = new HeadersBuilder().withHeader('x-test', 'initial').withHeader('x-test', 'updated').build();
      expect(headers.get('x-test')).to.equal('updated');
    });

    it('should be chainable', () => {
      const builder = new HeadersBuilder();
      const result = builder.withHeader('x-test', 'value');
      expect(result).to.equal(builder);
    });
  });

  describe('method chaining', () => {
    it('should allow method chaining', () => {
      const headers = new HeadersBuilder().acceptJson().contentTypeJson().withHeader('x-custom', 'value').build();

      expect(headers.get('accept')).to.equal('application/json');
      expect(headers.get('content-type')).to.equal('application/json');
      expect(headers.get('x-custom')).to.equal('value');
    });
  });

  describe('build', () => {
    it('should return a Headers instance', () => {
      const builder = new HeadersBuilder();
      const headers = builder.build();
      expect(headers).to.be.instanceOf(Headers);
    });
  });

  describe('case insensitivity', () => {
    it('should treat header names case-insensitively', () => {
      const builder = new HeadersBuilder();
      builder.withHeader('X-Custom', 'value');

      const headers = builder.build();
      expect(headers.get('x-custom')).to.equal('value');
      expect(headers.get('X-CUSTOM')).to.equal('value');
      expect(headers.get('x-CuStOm')).to.equal('value');
    });
  });
});

/** @param {Headers} headers */
function getHeadersEntries(headers) {
  return Array.from(headers.entries());
}
