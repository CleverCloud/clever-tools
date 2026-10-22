import { describe, it } from 'node:test';
import pkg from '../../../package.json' with { type: 'json' };
import { assertCleverResult } from '../../../test/assert-clever-result.ts';
import { setupCleverSandbox } from '../../../test/setup-clever-sandbox.ts';

describe('clever version', () => {
  const { runClever } = setupCleverSandbox();

  describe('Happy path', () => {
    it('should print the version of clever-tools', async () => {
      const result = await runClever(['version']);

      assertCleverResult(result, { exitCode: 0, stdoutText: pkg.version });
    });
  });
});
