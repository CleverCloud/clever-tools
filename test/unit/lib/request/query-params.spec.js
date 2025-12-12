import { expect } from 'chai';
import { QueryParams } from '../../../../src/lib/request/query-params.js';

describe('QueryParams class', () => {
  describe('constructor', () => {
    it('should initialize with no parameters', () => {
      const params = new QueryParams();
      expect(params.toObject()).to.deep.equal({});
    });

    it('should initialize with parameters', () => {
      const params = new QueryParams({
        name: 'test',
        ids: [1, 2, 3],
        flag: true,
      });
      expect(params.toObject()).to.deep.equal({
        name: 'test',
        ids: [1, 2, 3],
        flag: true,
      });
    });

    it('should handle null or undefined initial parameters', () => {
      const params = new QueryParams(null);
      expect(params.toObject()).to.deep.equal({});
    });
  });

  describe('set', () => {
    it('should set a single value', () => {
      const params = new QueryParams();
      params.set('name', 'test');
      expect(params.get('name')).to.equal('test');
    });

    it('should set an array value', () => {
      const params = new QueryParams();
      params.set('ids', [1, 2, 3]);
      expect(params.get('ids')).to.deep.equal([1, 2, 3]);
    });

    it('should override existing value', () => {
      const params = new QueryParams({ name: 'old' });
      params.set('name', 'new');
      expect(params.get('name')).to.equal('new');
    });
  });

  describe('setParams', () => {
    it('should set multiple parameters', () => {
      const params = new QueryParams();
      params.setParams({
        name: 'test',
        active: true,
        items: ['a', 'b'],
      });
      expect(params.toObject()).to.deep.equal({
        name: 'test',
        active: true,
        items: ['a', 'b'],
      });
    });
  });

  describe('get', () => {
    it('should return undefined for non-existent key', () => {
      const params = new QueryParams();
      expect(params.get('nonexistent')).to.be.undefined;
    });

    it('should return the correct value', () => {
      const params = new QueryParams({ name: 'test' });
      expect(params.get('name')).to.equal('test');
    });
  });

  describe('append', () => {
    it('should append to existing value', () => {
      const params = new QueryParams({ tags: 'js' });
      params.append('tags', 'node');
      expect(params.get('tags')).to.deep.equal(['js', 'node']);
    });

    it('should handle appending to non-existent key', () => {
      const params = new QueryParams();
      params.append('tags', 'js');
      expect(params.get('tags')).to.equal('js');
    });

    it('should handle appending arrays', () => {
      const params = new QueryParams({ tags: ['js'] });
      params.append('tags', ['node', 'typescript']);
      expect(params.get('tags')).to.deep.equal(['js', 'node', 'typescript']);
    });
  });

  describe('remove', () => {
    it('should remove an existing parameter', () => {
      const params = new QueryParams({ name: 'test', id: 1 });
      params.remove('name');
      expect(params.toObject()).to.deep.equal({ id: 1 });
    });

    it('should do nothing for non-existent key', () => {
      const params = new QueryParams({ id: 1 });
      params.remove('nonexistent');
      expect(params.toObject()).to.deep.equal({ id: 1 });
    });
  });

  describe('entries', () => {
    it('should return all entries', () => {
      const params = new QueryParams({ name: 'test', id: 1 });
      const entries = Array.from(params.entries());
      expect(entries).to.have.lengthOf(2);
      expect(entries).to.deep.include(['name', 'test']);
      expect(entries).to.deep.include(['id', 1]);
    });
  });

  describe('applyOnUrl', () => {
    it('should apply parameters to URL', () => {
      const url = new URL('https://example.com');
      const params = new QueryParams({
        name: 'test',
        ids: [1, 2],
        active: true,
      });
      params.applyOnUrl(url);
      expect(url.searchParams.toString()).to.equal('name=test&ids=1&ids=2&active=true');
    });

    it('should handle null/undefined values', () => {
      const url = new URL('https://example.com');
      const params = new QueryParams({
        name: null,
        id: undefined,
        active: true,
      });
      params.applyOnUrl(url);
      expect(url.searchParams.toString()).to.equal('active=true');
    });
  });

  describe('toObject', () => {
    it('should return an empty object for no parameters', () => {
      const params = new QueryParams();
      expect(params.toObject()).to.deep.equal({});
    });

    it('should convert parameters to a plain object', () => {
      const params = new QueryParams({
        name: 'test',
        ids: [1, 2],
        active: true,
        empty: null,
        undef: undefined,
        emptyArray: [],
      });
      expect(params.toObject()).to.deep.equal({
        name: 'test',
        ids: [1, 2],
        active: true,
      });
    });
  });
});
