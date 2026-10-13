import assert from 'node:assert';
import { describe, it } from 'node:test';
import { DRAIN_TYPES, filterDrainsByType } from './drain.js';

describe('filterDrainsByType', () => {
  const drains = [
    { id: 'a', recipient: { type: 'DATADOG' } },
    { id: 'b', recipient: { type: 'ELASTICSEARCH' } },
    { id: 'c', recipient: { type: 'DATADOG' } },
  ];

  it('keeps all drains without a type', () => {
    assert.deepStrictEqual(filterDrainsByType(drains, undefined), drains);
  });

  it('keeps only the drains whose recipient matches the API code of the type', () => {
    const filtered = filterDrainsByType(drains, DRAIN_TYPES.DATADOG);
    assert.deepStrictEqual(
      filtered.map((drain) => drain.id),
      ['a', 'c'],
    );
  });

  it('returns an empty list when no drain matches', () => {
    assert.deepStrictEqual(filterDrainsByType(drains, DRAIN_TYPES.SPLUNK), []);
  });
});
