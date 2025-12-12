import { expect } from 'chai';
import {
  combineWithSignal,
  merge,
  mergeRequestConfig,
  mergeRequestConfigPartial,
  normalizeDate,
  omit,
  randomUUID,
  safeUrl,
  sortBy,
  toArray,
} from '../../../src/lib/utils.js';

describe('Utils', () => {
  describe('omit', () => {
    it('should remove specified keys from object', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = omit(obj, 'b', 'c');
      expect(result).to.deep.equal({ a: 1 });
    });

    it('should not modify original object', () => {
      const obj = { a: 1, b: 2, c: 3 };
      omit(obj, 'b', 'c');
      expect(obj).to.deep.equal({ a: 1, b: 2, c: 3 });
    });

    it('should handle empty keys array', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = omit(obj);
      expect(result).to.deep.equal(obj);
    });
  });

  describe('toArray', () => {
    it('should convert single value to array', () => {
      const result = toArray('test');
      expect(result).to.deep.equal(['test']);
    });

    it('should return array unchanged', () => {
      const array = ['test', 'test2'];
      const result = toArray(array);
      expect(result).to.deep.equal(array);
    });

    it('should handle null value', () => {
      const result = toArray(null);
      expect(result).to.deep.equal([null]);
    });
  });

  describe('normalizeDate', () => {
    it('should handle Date object', () => {
      const date = new Date('2023-05-22T08:47:10.000Z');
      const result = normalizeDate(date);
      expect(result).to.equal('2023-05-22T08:47:10.000Z');
    });

    it('should handle date string', () => {
      const result = normalizeDate('2023-05-22');
      expect(result).to.match(/^2023-05-22T/);
    });

    it('should handle timestamp number', () => {
      const result = normalizeDate(1700000000000);
      expect(result).to.match(/^2023-11-14T/);
    });

    it('should return null for null input', () => {
      const result = normalizeDate(null);
      expect(result).to.be.null;
    });

    it('should fix [UTC] suffix', () => {
      const result = normalizeDate('2023-05-22T08:47:10.000Z[UTC]');
      expect(result).to.equal('2023-05-22T08:47:10.000Z');
    });

    it('should throw error for invalid date', () => {
      // @ts-ignore
      expect(() => normalizeDate({})).to.throw('Invalid date: [object Object]');
    });
  });

  describe('safeUrl', () => {
    it('should encode string values', () => {
      const result = safeUrl`https://example.com/?q=${'search term'}`;
      expect(result).to.equal('https://example.com/?q=search%20term');
    });

    it('should handle multiple values', () => {
      const result = safeUrl`https://example.com/${'path'}/${'with spaces'}`;
      expect(result).to.equal('https://example.com/path/with%20spaces');
    });

    it('should convert non-string values to string', () => {
      const result = safeUrl`https://example.com/${123}`;
      expect(result).to.equal('https://example.com/123');
    });

    it('should handle null values', () => {
      const result = safeUrl`https://example.com/`;
      expect(result).to.equal('https://example.com/');
    });

    it('should handle empty string values', () => {
      const result = safeUrl`https://example.com/${''}`;
      expect(result).to.equal('https://example.com/');
    });
  });

  describe('randomUUID', async () => {
    expect(await randomUUID()).to.match(
      /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/,
    );
  });

  describe('sortBy', () => {
    it('should sort by string property', () => {
      const result = sortBy([{ prop: 'b' }, { prop: 'a' }], 'prop');
      expect(result).to.deep.equal([{ prop: 'a' }, { prop: 'b' }]);
    });

    it('should sort by number property', () => {
      const result = sortBy([{ prop: 2 }, { prop: 1 }], 'prop');
      expect(result).to.deep.equal([{ prop: 1 }, { prop: 2 }]);
    });

    it('should sort by date iso', () => {
      const result = sortBy(
        [
          { prop: new Date('2025-07-28T09:50:02.175Z').toISOString() },
          { prop: new Date('2023-07-28T09:50:02.175Z').toISOString() },
        ],
        'prop',
      );
      expect(result).to.deep.equal([
        { prop: new Date('2023-07-28T09:50:02.175Z').toISOString() },
        { prop: new Date('2025-07-28T09:50:02.175Z').toISOString() },
      ]);
    });

    it('should sort by multiple properties (on first property)', () => {
      const result = sortBy(
        [
          { prop1: 'b', prop2: 2 },
          { prop1: 'a', prop2: 1 },
        ],
        'prop1',
        'prop2',
      );
      expect(result).to.deep.equal([
        { prop1: 'a', prop2: 1 },
        { prop1: 'b', prop2: 2 },
      ]);
    });

    it('should sort by multiple properties (on second property)', () => {
      const result = sortBy(
        [
          { prop1: 'b', prop2: 2 },
          { prop1: 'b', prop2: 1 },
        ],
        'prop1',
        'prop2',
      );
      expect(result).to.deep.equal([
        { prop1: 'b', prop2: 1 },
        { prop1: 'b', prop2: 2 },
      ]);
    });

    it('should sort with desc order', () => {
      const result = sortBy([{ prop: 'a' }, { prop: 'b' }], { key: 'prop', order: 'desc' });
      expect(result).to.deep.equal([{ prop: 'b' }, { prop: 'a' }]);
    });

    it('should sort with asc order', () => {
      const result = sortBy([{ prop: 'b' }, { prop: 'a' }], { key: 'prop', order: 'asc' });
      expect(result).to.deep.equal([{ prop: 'a' }, { prop: 'b' }]);
    });
  });

  describe('merge', () => {
    /** @type {{ prop1: string, prop2: string, prop3?: string }} */
    const props = { prop1: 'prop1', prop2: 'prop2' };

    it('should merge objects', () => {
      const result = merge(props, { prop1: 'overridden prop1', prop3: 'prop3' });

      expect(result).to.deep.equal({ prop1: 'overridden prop1', prop2: 'prop2', prop3: 'prop3' });
    });

    it('should not override null property', () => {
      const result = merge(props, { prop1: null });

      expect(result).to.deep.equal({ prop1: 'prop1', prop2: 'prop2' });
    });

    it('should not override undefined property', () => {
      const result = merge(props, { prop1: undefined });

      expect(result).to.deep.equal({ prop1: 'prop1', prop2: 'prop2' });
    });
  });

  describe('combineWithSignal', () => {
    it('should combine', async () => {
      const ac1 = new AbortController();
      const ac2 = new AbortController();
      combineWithSignal(ac1, ac2.signal);

      const result = await new Promise((resolve) => {
        ac1.signal.addEventListener('abort', () => resolve('ok'));
        ac2.abort();
      });

      expect(result).to.equal('ok');
    });
  });

  describe('mergeRequestConfig', () => {
    it('should merge request config with null config', () => {
      const config = mergeRequestConfig(
        {
          cors: true,
          timeout: 0,
          cache: null,
          debug: true,
        },
        null,
      );
      expect(config).to.deep.equal({
        cors: true,
        timeout: 0,
        cache: null,
        debug: true,
      });
    });

    it('should merge request config with empty config', () => {
      const config = mergeRequestConfig(
        {
          cors: true,
          timeout: 0,
          cache: null,
          debug: true,
        },
        {},
      );
      expect(config).to.deep.equal({
        cors: true,
        timeout: 0,
        cache: null,
        debug: true,
      });
    });

    it('should merge request config with config', () => {
      const config = mergeRequestConfig(
        {
          cors: true,
          timeout: 0,
          cache: null,
          debug: true,
        },
        {
          cors: false,
          timeout: 10,
          cache: { ttl: 1000 },
          debug: false,
        },
      );
      expect(config).to.deep.equal({
        cors: false,
        timeout: 10,
        cache: { ttl: 1000 },
        debug: false,
      });
    });

    it('should merge request config with partial config', () => {
      const config = mergeRequestConfig(
        {
          cors: true,
          timeout: 0,
          cache: null,
          debug: true,
        },
        {
          cache: { ttl: 1000 },
          debug: false,
        },
      );
      expect(config).to.deep.equal({
        cors: true,
        timeout: 0,
        cache: { ttl: 1000 },
        debug: false,
      });
    });

    describe('cache config', () => {
      it('should not merge null cache with undefined cache', () => {
        const config = mergeRequestConfig(
          {
            cors: true,
            timeout: 0,
            cache: null,
            debug: true,
          },
          {},
        );
        expect(config.cache).to.deep.equal(null);
      });

      it('should not merge cache with undefined cache', () => {
        const config = mergeRequestConfig(
          {
            cors: true,
            timeout: 0,
            cache: { ttl: 1000 },
            debug: true,
          },
          {},
        );
        expect(config.cache).to.deep.equal({ ttl: 1000 });
      });

      it('should merge cache with null cache', () => {
        const config = mergeRequestConfig(
          {
            cors: true,
            timeout: 0,
            cache: { ttl: 1000 },
            debug: true,
          },
          {
            cache: null,
          },
        );
        expect(config.cache).to.deep.equal(null);
      });

      it('should merge null cache with cache', () => {
        const config = mergeRequestConfig(
          {
            cors: true,
            timeout: 0,
            cache: null,
            debug: true,
          },
          {
            cache: { ttl: 10 },
          },
        );
        expect(config.cache).to.deep.equal({ ttl: 10 });
      });

      it('should merge null cache with partial cache (use `0` ttl)', () => {
        const config = mergeRequestConfig(
          {
            cors: true,
            timeout: 0,
            cache: null,
            debug: true,
          },
          {
            cache: { mode: 'reload' },
          },
        );
        expect(config.cache).to.deep.equal({ mode: 'reload', ttl: 0 });
      });

      it('should merge cache with partial cache', () => {
        const config = mergeRequestConfig(
          {
            cors: true,
            timeout: 0,
            cache: { ttl: 1000 },
            debug: true,
          },
          {
            cache: { mode: 'reload' },
          },
        );
        expect(config.cache).to.deep.equal({ mode: 'reload', ttl: 1000 });
      });
    });
  });

  describe('mergeRequestConfigPartial', () => {
    it('should merge undefined with undefined', () => {
      const config = mergeRequestConfigPartial(undefined, undefined);
      expect(config).to.deep.equal({});
    });

    it('should merge partial config with undefined', () => {
      const config = mergeRequestConfigPartial({ cors: true }, undefined);
      expect(config).to.deep.equal({ cors: true });
    });

    it('should merge partial config with empty config', () => {
      const config = mergeRequestConfigPartial({ cors: true }, {});
      expect(config).to.deep.equal({ cors: true });
    });

    it('should merge partial config with partial config', () => {
      const config = mergeRequestConfigPartial({ cors: true, debug: true }, { cors: false, timeout: 10 });
      expect(config).to.deep.equal({ cors: false, timeout: 10, debug: true });
    });

    describe('cache config', () => {
      it('should not merge null cache with undefined cache', () => {
        const config = mergeRequestConfigPartial(
          {
            cache: null,
          },
          {},
        );
        expect(config.cache).to.deep.equal(null);
      });

      it('should not merge partial cache with undefined cache', () => {
        const config = mergeRequestConfigPartial(
          {
            cache: { ttl: 1000 },
          },
          {},
        );
        expect(config.cache).to.deep.equal({ ttl: 1000 });
      });

      it('should merge partial cache with null cache', () => {
        const config = mergeRequestConfigPartial(
          {
            cache: { ttl: 1000 },
          },
          { cache: null },
        );
        expect(config.cache).to.deep.equal(null);
      });

      it('should merge partial cache with partial cache', () => {
        const config = mergeRequestConfigPartial(
          {
            cache: { ttl: 1000 },
          },
          { cache: { mode: 'reload' } },
        );
        expect(config.cache).to.deep.equal({ mode: 'reload', ttl: 1000 });
      });
    });
  });
});
