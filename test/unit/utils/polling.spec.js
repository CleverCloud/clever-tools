import { expect } from 'chai';
import * as hanbi from 'hanbi';
import { Polling } from '../../../src/utils/polling.js';
import { expectPromiseThrows } from '../../lib/expect-utils.js';

describe('polling', () => {
  it('should not timeout and return the right value', async function () {
    this.timeout(1_100);

    let count = 0;

    const polling = new Polling(
      async () => {
        count++;
        if (count === 3) {
          return { stop: true, value: 'value' };
        }
        return { stop: false };
      },
      100,
      1_000,
    );
    const result = await polling.start();

    expect(result).to.equal('value');
  });

  it('should fail with interrupted when stopping', async function () {
    this.timeout(1_100);

    const polling = new Polling(
      async () => {
        return { stop: false };
      },
      100,
      1_000,
    );
    const pollingPromise = polling.start();
    await sleep(200);

    polling.stop();

    await expectPromiseThrows(pollingPromise, (err) => {
      expect(err.message).to.equal('Interrupted');
    });
  });

  it('should tick the right amount of time', async function () {
    this.timeout(1_100);

    const spy = hanbi.spy();

    let count = 0;
    const polling = new Polling(
      async () => {
        spy.handler();
        count++;
        if (count === 3) {
          return { stop: true, value: 'value' };
        }
        return { stop: false };
      },
      100,
      1_000,
    );
    await polling.start();

    expect(spy.callCount).to.equal(3);
  });
});

/**
 *
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
