import { expect } from 'chai';
import { toMicroIsoString, toMicroTimestamp } from '../../../../esm/utils/date.js';

describe('date#toMicroIsoString()', () => {
  it('from timestamp without microseconds precision', () => {
    const date = new Date('2020-03-11T11:11:11.111Z');
    const milliTimestamp = date.getTime();
    const microTimestamp = milliTimestamp * 1000;
    const isoWithMicroseconds = toMicroIsoString(microTimestamp);
    expect(isoWithMicroseconds).to.equal('2020-03-11T11:11:11.111000Z');
  });

  it('from timestamp with microseconds precision', () => {
    const date = new Date('2020-03-11T11:11:11.111Z');
    const milliTimestamp = date.getTime();
    const microTimestamp = milliTimestamp * 1000 + 345;
    const isoWithMicroseconds = toMicroIsoString(microTimestamp);
    expect(isoWithMicroseconds).to.equal('2020-03-11T11:11:11.111345Z');
  });
});

describe('date#toMicroTimestamp()', () => {
  it('from round micro ISO string', () => {
    const microTimestamp = toMicroTimestamp('2020-03-11T11:11:11.111000Z');
    const milliTimestamp = new Date('2020-03-11T11:11:11.111Z').getTime();
    expect(microTimestamp).to.equal(milliTimestamp * 1000);
  });

  it('from precise micro ISO string', () => {
    const microTimestamp = toMicroTimestamp('2020-03-11T11:11:11.111345Z');
    const milliTimestamp = new Date('2020-03-11T11:11:11.111Z').getTime();
    expect(microTimestamp).to.equal(milliTimestamp * 1000 + 345);
  });

  it('from milli ISO string', () => {
    const microTimestamp = toMicroTimestamp('2020-03-11T11:11:11.111Z');
    const milliTimestamp = new Date('2020-03-11T11:11:11.111Z').getTime();
    expect(microTimestamp).to.equal(milliTimestamp * 1000);
  });
});
