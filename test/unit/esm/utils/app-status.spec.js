import { expect } from 'chai';
import { getStatus } from '../../../../esm/utils/app-status.js';

describe('app-status#getStatus()', () => {
  it('stopped', () => {
    const status = getStatus({ state: 'SHOULD_BE_DOWN', homogeneous: false }, null, null);
    expect(status).to.equal('stopped');
  });

  it('starting', () => {
    const status = getStatus({ state: 'WANTS_TO_BE_UP', homogeneous: false }, [{ state: 'WIP' }], []);
    expect(status).to.equal('starting');
  });

  it('start-failed', () => {
    const status = getStatus({ state: 'WANTS_TO_BE_UP', homogeneous: false }, [{ state: 'FAIL' }], []);
    expect(status).to.equal('start-failed');
  });

  it('restarting', () => {
    const status = getStatus({ state: 'SHOULD_BE_UP', homogeneous: false }, [{ state: 'WIP' }], [{ state: 'UP' }]);
    expect(status).to.equal('restarting');
  });

  it('running (last deploy failed)', () => {
    const status = getStatus({ state: 'SHOULD_BE_UP', homogeneous: false }, [{ state: 'FAIL' }], [{ state: 'UP' }]);
    expect(status).to.equal('restart-failed');
  });

  it('restarting-with-downtime', () => {
    const status = getStatus({ state: 'SHOULD_BE_UP', homogeneous: true }, [{ state: 'WIP' }], []);
    expect(status).to.equal('restarting-with-downtime');
  });

  it('running', () => {
    const status = getStatus({ state: 'SHOULD_BE_UP', homogeneous: false }, [], [{ state: 'UP' }]);
    expect(status).to.equal('running');
  });

  it('unknown (WANTS_TO_BE_UP, deploy OK but not instance)', () => {
    const status = getStatus({ state: 'WANTS_TO_BE_UP', homogeneous: false }, [{ state: 'OK' }], []);
    expect(status).to.equal('unknown');
  });
});
