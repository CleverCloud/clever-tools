import assert from 'node:assert';
import { describe, it } from 'node:test';
import { filterOwners } from './organisation.js';

describe('filterOwners', () => {
  const alpha = { id: 'user_a', name: 'Alpha' };
  const beta = { id: 'orga_b', name: 'Beta' };
  const gammaC = { id: 'orga_c', name: 'Gamma' };
  const gammaD = { id: 'orga_d', name: 'Gamma' };
  const owners = [beta, alpha, gammaC, gammaD];

  it('keeps every owner, sorted by name, without a filter', () => {
    assert.deepStrictEqual(filterOwners(owners, null), [alpha, beta, gammaC, gammaD]);
  });

  it('keeps only the owner matching an ID', () => {
    assert.deepStrictEqual(filterOwners(owners, { orga_id: 'orga_b' }), [beta]);
  });

  it('keeps no owner for an unknown ID', () => {
    assert.deepStrictEqual(filterOwners(owners, { orga_id: 'orga_unknown' }), []);
  });

  it('keeps only the owner matching a name', () => {
    assert.deepStrictEqual(filterOwners(owners, { orga_name: 'Alpha' }), [alpha]);
  });

  it('throws for an unknown name', () => {
    assert.throws(() => filterOwners(owners, { orga_name: 'Delta' }), { message: 'Organisation not found' });
  });

  it('throws for a name shared by several owners', () => {
    assert.throws(() => filterOwners(owners, { orga_name: 'Gamma' }), { message: 'Ambiguous organisation name' });
  });

  it('does not reorder the given owners', () => {
    filterOwners(owners, null);
    assert.deepStrictEqual(owners, [beta, alpha, gammaC, gammaD]);
  });
});
